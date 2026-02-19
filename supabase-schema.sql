-- ============================================
-- 내벨업 테스트룸 - Supabase 스키마
-- ============================================

-- 1. 빈칸채우기 세트
CREATE TABLE reading_fillblank_sets (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    passage TEXT NOT NULL,
    time_limit INTEGER DEFAULT 180,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 2. 빈칸채우기 빈칸 데이터
CREATE TABLE reading_fillblank_blanks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    set_id TEXT REFERENCES reading_fillblank_sets(id) ON DELETE CASCADE,
    blank_order INTEGER NOT NULL,
    start_index INTEGER NOT NULL,
    prefix TEXT,
    answer TEXT NOT NULL,
    blank_count INTEGER NOT NULL,
    explanation TEXT,
    common_mistakes TEXT,
    mistakes_explanation TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. 일상리딩1 세트
CREATE TABLE reading_daily1_sets (
    id TEXT PRIMARY KEY,
    main_title TEXT NOT NULL,
    passage_title TEXT NOT NULL,
    passage_content TEXT NOT NULL,
    time_limit INTEGER DEFAULT 60,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 4. 일상리딩1 문장 번역
CREATE TABLE reading_daily1_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    set_id TEXT REFERENCES reading_daily1_sets(id) ON DELETE CASCADE,
    sentence_order INTEGER NOT NULL,
    translation TEXT NOT NULL
);

-- 5. 일상리딩1 인터랙티브 단어
CREATE TABLE reading_daily1_interactive_words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    set_id TEXT REFERENCES reading_daily1_sets(id) ON DELETE CASCADE,
    word_order INTEGER NOT NULL,
    word TEXT NOT NULL,
    translation TEXT NOT NULL,
    explanation TEXT
);

-- 6. 일상리딩1 문제
CREATE TABLE reading_daily1_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    set_id TEXT REFERENCES reading_daily1_sets(id) ON DELETE CASCADE,
    question_order INTEGER NOT NULL,
    question_num TEXT,
    question_text TEXT NOT NULL,
    question_translation TEXT,
    correct_answer INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 7. 일상리딩1 보기
CREATE TABLE reading_daily1_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES reading_daily1_questions(id) ON DELETE CASCADE,
    option_order INTEGER NOT NULL,
    label TEXT NOT NULL,
    text TEXT NOT NULL,
    translation TEXT,
    explanation TEXT
);

-- 8. 일상리딩2 세트 (구조는 일상리딩1과 유사)
CREATE TABLE reading_daily2_sets (
    id TEXT PRIMARY KEY,
    main_title TEXT NOT NULL,
    passage_title TEXT NOT NULL,
    passage_content TEXT NOT NULL,
    time_limit INTEGER DEFAULT 80,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE reading_daily2_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    set_id TEXT REFERENCES reading_daily2_sets(id) ON DELETE CASCADE,
    sentence_order INTEGER NOT NULL,
    translation TEXT NOT NULL
);

CREATE TABLE reading_daily2_interactive_words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    set_id TEXT REFERENCES reading_daily2_sets(id) ON DELETE CASCADE,
    word_order INTEGER NOT NULL,
    word TEXT NOT NULL,
    translation TEXT NOT NULL,
    explanation TEXT
);

CREATE TABLE reading_daily2_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    set_id TEXT REFERENCES reading_daily2_sets(id) ON DELETE CASCADE,
    question_order INTEGER NOT NULL,
    question_num TEXT,
    question_text TEXT NOT NULL,
    question_translation TEXT,
    correct_answer INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE reading_daily2_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES reading_daily2_questions(id) ON DELETE CASCADE,
    option_order INTEGER NOT NULL,
    label TEXT NOT NULL,
    text TEXT NOT NULL,
    translation TEXT,
    explanation TEXT
);

-- 9. 아카데믹리딩 세트
CREATE TABLE reading_academic_sets (
    id TEXT PRIMARY KEY,
    main_title TEXT NOT NULL,
    passage_title TEXT NOT NULL,
    passage_content TEXT NOT NULL,
    time_limit INTEGER DEFAULT 300,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE reading_academic_translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    set_id TEXT REFERENCES reading_academic_sets(id) ON DELETE CASCADE,
    sentence_order INTEGER NOT NULL,
    translation TEXT NOT NULL
);

CREATE TABLE reading_academic_interactive_words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    set_id TEXT REFERENCES reading_academic_sets(id) ON DELETE CASCADE,
    word_order INTEGER NOT NULL,
    word TEXT NOT NULL,
    translation TEXT NOT NULL,
    explanation TEXT
);

CREATE TABLE reading_academic_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    set_id TEXT REFERENCES reading_academic_sets(id) ON DELETE CASCADE,
    question_order INTEGER NOT NULL,
    question_num TEXT,
    question_text TEXT NOT NULL,
    question_translation TEXT,
    correct_answer INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE reading_academic_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES reading_academic_questions(id) ON DELETE CASCADE,
    option_order INTEGER NOT NULL,
    label TEXT NOT NULL,
    text TEXT NOT NULL,
    translation TEXT,
    explanation TEXT
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_fillblank_blanks_set_id ON reading_fillblank_blanks(set_id);
CREATE INDEX idx_daily1_questions_set_id ON reading_daily1_questions(set_id);
CREATE INDEX idx_daily1_options_question_id ON reading_daily1_options(question_id);
CREATE INDEX idx_daily2_questions_set_id ON reading_daily2_questions(set_id);
CREATE INDEX idx_daily2_options_question_id ON reading_daily2_options(question_id);
CREATE INDEX idx_academic_questions_set_id ON reading_academic_questions(set_id);
CREATE INDEX idx_academic_options_question_id ON reading_academic_options(question_id);

-- Row Level Security 활성화 (선택사항)
ALTER TABLE reading_fillblank_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_fillblank_blanks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_daily1_sets ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_daily1_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reading_daily1_options ENABLE ROW LEVEL SECURITY;
-- ... (다른 테이블도 동일)

-- 읽기 권한 정책 (모든 사용자가 읽기 가능)
CREATE POLICY "Enable read access for all users" ON reading_fillblank_sets FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON reading_fillblank_blanks FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON reading_daily1_sets FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON reading_daily1_questions FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON reading_daily1_options FOR SELECT USING (true);
-- ... (다른 테이블도 동일)

-- 쓰기 권한 정책 (관리자만 수정 가능 - 필요시 설정)
-- CREATE POLICY "Enable write access for admins" ON reading_fillblank_sets FOR ALL USING (auth.uid() IN (SELECT user_id FROM admins));
