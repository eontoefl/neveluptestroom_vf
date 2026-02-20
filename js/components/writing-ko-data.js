/**
 * writing-ko-data.js
 * 라이팅 한글 번역 데이터 로드 (gid=676607019)
 * v=003 - 멀티라인 CSV 파싱 + 캐시 버전 관리
 */

console.log('✅ writing-ko-data.js 로드 완료');

const WritingKoData = {
    CACHE_VERSION: 'v003',  // 캐시 버전 (변경 시 자동 무효화)
    
    SHEET_CONFIG: {
        spreadsheetId: '1Na3AmaqNeE2a3gcq7koj0TF2jGZhS7m8PFuk2S8rRfo',
        gid: '676607019'
    },
    
    cache: null,
    
    async load() {
        if (this.cache) {
            console.log('📦 [KoData] 캐시 사용');
            return this.cache;
        }
        
        const cacheKey = `writing_ko_cache_${this.CACHE_VERSION}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) {
            this.cache = JSON.parse(cached);
            console.log(`📦 [KoData] sessionStorage 캐시 사용 (${this.CACHE_VERSION})`);
            return this.cache;
        }
        
        // 이전 버전 캐시 삭제
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith('writing_ko_cache') && key !== cacheKey) {
                sessionStorage.removeItem(key);
            }
        }
        
        // 1) Supabase 우선 시도
        const supabaseResult = await this._loadFromSupabase();
        if (supabaseResult) {
            this.cache = supabaseResult;
            sessionStorage.setItem(cacheKey, JSON.stringify(this.cache));
            return this.cache;
        }
        
        // 2) Google Sheets 폴백
        console.log('🔄 [KoData] Google Sheets 폴백 시도...');
        const csvUrl = `https://docs.google.com/spreadsheets/d/${this.SHEET_CONFIG.spreadsheetId}/export?format=csv&gid=${this.SHEET_CONFIG.gid}`;
        console.log('📥 [KoData] CSV 다운로드:', csvUrl);
        
        try {
            const response = await fetch(csvUrl);
            const csvText = await response.text();
            console.log(`✅ [KoData] CSV 다운로드 완료 (${csvText.length} bytes)`);
            
            this.cache = this.parseCSV(csvText);
            
            // 파싱 결과 디버깅
            for (const [key, val] of Object.entries(this.cache.email)) {
                console.log(`📧 [KoData] email[${key}] 길이: ${val.length}, 줄바꿈수: ${(val.match(/\n/g) || []).length}`);
            }
            for (const [key, val] of Object.entries(this.cache.discussion)) {
                console.log(`💬 [KoData] discussion[${key}] 길이: ${val.length}, 줄바꿈수: ${(val.match(/\n/g) || []).length}`);
            }
            
            sessionStorage.setItem(cacheKey, JSON.stringify(this.cache));
            
            return this.cache;
        } catch (error) {
            console.error('❌ [KoData] 로드 실패:', error);
            return { email: {}, discussion: {} };
        }
    },
    
    // --- Supabase에서 로드 ---
    async _loadFromSupabase() {
        if (typeof USE_SUPABASE !== 'undefined' && !USE_SUPABASE) return null;
        if (typeof supabaseSelect !== 'function') return null;
        
        try {
            console.log('📥 [KoData] Supabase에서 데이터 로드...');
            const rows = await supabaseSelect('tr_writing_ko_data', 'select=*&order=id.asc');
            
            if (!rows || rows.length === 0) {
                console.warn('⚠️ [KoData] Supabase 데이터 없음');
                return null;
            }
            
            console.log(`✅ [KoData] Supabase에서 ${rows.length}개 행 로드 성공`);
            
            const result = { email: {}, discussion: {} };
            rows.forEach(row => {
                const type = (row.type || '').trim();
                const setId = (row.set_id || '').trim();
                const koText = (row.ko_text || '').trim();
                if (!koText) return;
                
                if (type === 'email') {
                    result.email[setId] = koText;
                } else if (type === 'discussion') {
                    result.discussion[setId] = koText;
                }
            });
            
            console.log(`✅ [KoData] Supabase 파싱 완료 - email: ${Object.keys(result.email).length}개, discussion: ${Object.keys(result.discussion).length}개`);
            return result;
            
        } catch (error) {
            console.error('❌ [KoData] Supabase 로드 실패:', error);
            return null;
        }
    },
    
    /**
     * CSV 파싱 (멀티라인 셀 지원)
     * Google Sheets에서 셀 안에 줄바꿈이 있으면 셀 전체가 쌍따옴표로 감싸짐
     * 예: type,setId,"여기에\n줄바꿈이\n있는 텍스트"
     */
    parseCSV(csvText) {
        const result = { email: {}, discussion: {} };
        
        // ★ 멀티라인 지원: 단순 split('\n') 대신 따옴표 상태를 추적하며 행 분리
        const rows = this.splitCSVRows(csvText);
        
        console.log(`📊 [KoData] CSV 행 수: ${rows.length} (헤더 포함)`);
        
        // 헤더 제외 (1부터 시작)
        for (let i = 1; i < rows.length; i++) {
            const columns = this.parseCSVLine(rows[i]);
            if (columns.length < 3) continue;
            
            const type = columns[0].trim();
            const setId = columns[1].trim();
            const koText = columns[2].trim();
            
            if (!koText) continue;
            
            if (type === 'email') {
                result.email[setId] = koText;
            } else if (type === 'discussion') {
                result.discussion[setId] = koText;
            }
        }
        
        console.log(`✅ [KoData] 파싱 완료 - email: ${Object.keys(result.email).length}개, discussion: ${Object.keys(result.discussion).length}개`);
        return result;
    },
    
    /**
     * ★ 멀티라인 CSV 행 분리
     * 따옴표 안의 줄바꿈은 같은 행으로 유지
     */
    splitCSVRows(csvText) {
        const rows = [];
        let currentRow = '';
        let inQuotes = false;
        
        for (let i = 0; i < csvText.length; i++) {
            const char = csvText[i];
            
            if (char === '"') {
                // 이스케이프된 따옴표("") 처리
                if (inQuotes && i + 1 < csvText.length && csvText[i + 1] === '"') {
                    currentRow += '""';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                    currentRow += char;
                }
            } else if (char === '\n' && !inQuotes) {
                // 따옴표 밖의 줄바꿈 = 행 구분
                if (currentRow.trim()) {
                    rows.push(currentRow);
                }
                currentRow = '';
            } else if (char === '\r') {
                // \r 무시 (Windows 줄바꿈 \r\n 대응)
                continue;
            } else {
                currentRow += char;
            }
        }
        
        // 마지막 행
        if (currentRow.trim()) {
            rows.push(currentRow);
        }
        
        return rows;
    },
    
    /**
     * CSV 라인 파싱 (쉼표, 따옴표 처리)
     */
    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (inQuotes) {
                if (char === '"' && i + 1 < line.length && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else if (char === '"') {
                    inQuotes = false;
                } else {
                    current += char;
                }
            } else {
                if (char === '"') {
                    inQuotes = true;
                } else if (char === ',') {
                    result.push(current);
                    current = '';
                } else {
                    current += char;
                }
            }
        }
        result.push(current);
        
        return result;
    },
    
    /**
     * 특정 세트의 한글 번역 가져오기
     */
    async get(type, setId) {
        const data = await this.load();
        return data[type]?.[setId] || '';
    },
    
    /**
     * 캐시 무효화 (데이터 갱신 시)
     */
    clearCache() {
        this.cache = null;
        sessionStorage.removeItem(`writing_ko_cache_${this.CACHE_VERSION}`);
        // 이전 버전 캐시도 삭제
        for (let i = sessionStorage.length - 1; i >= 0; i--) {
            const key = sessionStorage.key(i);
            if (key && key.startsWith('writing_ko_cache')) {
                sessionStorage.removeItem(key);
            }
        }
        console.log('🗑️ [KoData] 캐시 삭제');
    }
};

window.WritingKoData = WritingKoData;
