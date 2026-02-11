import React, { useState, useEffect, useMemo } from 'react';
import { 
  ChevronRight, RefreshCw, CheckCircle2, AlertCircle, 
  Briefcase, Palette, Lightbulb, HardHat, 
  User, Target, Zap, Clock, ChevronLeft, 
  Shield, Award, Construction, Sparkles, 
  MessageSquare, ListChecks, Loader2, ArrowRight,
  UserRound, PenTool, ClipboardList, Hammer, Settings, Share2, Copy
} from 'lucide-react';

const App = () => {
  const [step, setStep] = useState(0); 
  const [scores, setScores] = useState({ pm: 0, planner: 0, designer: 0, cm: 0 });
  const [aiAdvice, setAiAdvice] = useState("");
  const [aiInterview, setAiInterview] = useState(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [activeTab, setActiveTab] = useState('matrix');
  const [copyFeedback, setCopyFeedback] = useState(false);

  const apiKey = ""; // The execution environment provides the key

  // AI API Call with guardrails for commercial reliability
  const callGemini = async (prompt, retryCount = 0) => {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          systemInstruction: { parts: [{ text: "あなたはディスプレイ業界（展示会、店舗内装、イベント）に精通した人事コンサルタントです。診断結果に基づき、業界の事実に基づいたアドバイスを日本語で提供してください。確証のない事実や統計は捏造せず、わからない場合は『業界の傾向として一概には言えませんが』と断ってください。" }] }
        })
      });

      if (!response.ok) {
        if (response.status === 429 && retryCount < 5) {
          const delay = Math.pow(2, retryCount) * 1000;
          await new Promise(resolve => setTimeout(resolve, delay));
          return callGemini(prompt, retryCount + 1);
        }
        throw new Error('API request failed');
      }

      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text;
    } catch (error) {
      if (retryCount < 5) {
        const delay = Math.pow(2, retryCount) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
        return callGemini(prompt, retryCount + 1);
      }
      throw error;
    }
  };

  const generateAIContent = async (roleTitle, roleSubtitle, scoreData) => {
    setLoadingAI(true);
    try {
      const topRoles = Object.entries(scoreData).sort((a,b) => b[1]-a[1]).map(e => e[0]).join(", ");
      const advicePrompt = `診断結果「${roleTitle} (${roleSubtitle})」となりました。スコア傾向は ${topRoles} です。この職種が空間づくりにおいて果たす『究極の責任』と、学生が明日から取り組むべき自己研鑽を3つ、250文字程度で論理的に提示してください。`;
      const interviewPrompt = `職種「${roleTitle}」の採用において、就活生が『実務の厳しさ』を理解しているか問うための本質的な質問3つのリストをJSON形式で出力してください。フォーマット: {"questions": [{"q": "質問内容", "tip": "評価のポイント"}]}`;

      const [advice, interviewJson] = await Promise.all([
        callGemini(advicePrompt),
        callGemini(interviewPrompt + " ※JSONのみ出力。")
      ]);

      setAiAdvice(advice);
      try {
        const cleanedJson = interviewJson.replace(/```json|```/g, '').trim();
        const parsed = JSON.parse(cleanedJson);
        setAiInterview(parsed.questions);
      } catch (e) {
        console.error("JSON parse error", e);
      }
    } catch (error) {
      console.error(error);
      setAiAdvice("AIアドバイスの生成に失敗しました。時間をおいて再度お試しください。");
    } finally {
      setLoadingAI(false);
    }
  };

  const questions = [
    {
      text: "プロジェクトで最も『誇り』に感じる成果はどちらですか？",
      options: [
        { label: "予算・納期を完璧にコントロールし、クライアントからの全幅の信頼を得ること", points: { pm: 5, cm: 1 } },
        { label: "誰も見たことがないような革新的な空間を生み出し、来場者の心を奪うこと", points: { designer: 5, planner: 2 } }
      ]
    },
    {
      text: "あなたの『思考の原動力』を象徴する言葉は？",
      options: [
        { label: "「直感と感性」：空間のボリュームや素材の肌触りを瞬時にイメージする", points: { designer: 5, cm: 2 } },
        { label: "「論理と戦略」：なぜそのデザインが必要なのかを言葉で解き明かす", points: { planner: 5, pm: 2 } }
      ]
    },
    {
      text: "困難な局面において、あなたが心地よいと感じる役割は？",
      options: [
        { label: "利害関係の最前線に立ち、粘り強い交渉でプロジェクトを前進させること", points: { pm: 5, cm: 3 } },
        { label: "静かな環境で一人思考に沈み、課題を解決する究極のアイデアを捻り出すこと", points: { designer: 5, planner: 3 } }
      ]
    },
    {
      text: "モノ作りの『クオリティ』。あなたが真っ先にチェックする場所は？",
      options: [
        { label: "「接合部の精度」：現実の空間としての耐久性、安全性、仕上げの美しさ", points: { cm: 5, designer: 3 } },
        { label: "「文脈の整合性」：その空間がクライアントの課題をどう解決しているか", points: { planner: 5, pm: 2 } }
      ]
    },
    {
      text: "突然のトラブルで大幅なプラン変更が必要になったら？",
      options: [
        { label: "瞬時にコストと工期を再計算し、被害を最小限に抑える現実的な策を打つ", points: { pm: 5, cm: 1 } },
        { label: "制約の中でも『コンセプト』を死守し、よりクリエイティブな代替案を提案する", points: { planner: 4, designer: 3 } }
      ]
    },
    {
      text: "プロとしての『泥臭さ』。あなたが許容できるのは？",
      options: [
        { label: "夜間の搬入現場や長期出張。現場特有のスピード感と体力勝負の連帯感", points: { cm: 5, pm: 2 } },
        { label: "コンペ前夜、細部へのこだわりが止まらず、一睡もせずアウトプットを磨き抜くこと", points: { designer: 5, planner: 4 } }
      ]
    },
    {
      text: "膨大な契約書類や、数円単位の見積チェック. あなたにとってこれらは…",
      options: [
        { label: "「プロジェクトを守る盾」：正確に握ることが自分とチームの自由を保証する", points: { pm: 5, cm: 2 } },
        { label: "「できれば避けたい事務」：それよりもクリエイティブな拡張を考えたい", points: { designer: 4, planner: 2 } }
      ]
    },
    {
      text: "現場の職人さんと意見が分かれた時、あなたはどう振る舞いますか？",
      options: [
        { label: "現場のリアリティを尊重し、現実的かつ最も効率的な手法をその場で即決する", points: { cm: 5, pm: 1 } },
        { label: "一度論理を整理し、デザイン意図や全体コンセプトに立ち返って説得を試みる", points: { designer: 3, planner: 4 } }
      ]
    },
    {
      text: "他人の空間作品を見た時、真っ先に脳が動くのは？",
      options: [
        { label: "「どんな構造で立っているか」：素材、接合、物理的な成立過程への興味", points: { cm: 5, designer: 2 } },
        { label: "「誰をどう動かそうとしているか」：ターゲット、心理動線、戦略への興味", points: { planner: 5, pm: 2 } }
      ]
    },
    {
      text: "リーダーとしてチームを率いる際、大切にしたいのは？",
      options: [
        { label: "全員の顔色と進捗を読み、誰もが迷わず動ける最高のアシストを提供すること", points: { pm: 5, cm: 2 } },
        { label: "圧倒的な専門性とビジョンを示し、クオリティでメンバーの背筋を伸ばすこと", points: { designer: 4, cm: 3 } }
      ]
    },
    {
      text: "プレゼンにおいて、どちらで勝負したいですか？",
      options: [
        { label: "「確実性」：誰が聞いても破綻のない、盤石なスケジュールと予算配分", points: { pm: 5, cm: 2 } },
        { label: "「可能性」：クライアントさえも気づいていなかった、全く新しい未来の提示", points: { planner: 5, designer: 3 } }
      ]
    },
    {
      text: "品質・原価・工程・安全（Q-C-D-S）。この言葉に対する感覚は？",
      options: [
        { label: "モノ作りの聖典。これらすべてを掌握し、コントロールすることに興奮する", points: { cm: 5, pm: 3 } },
        { label: "あくまで制約条件。この範囲内でどこまで自由に振る舞えるかが勝負だ", points: { designer: 4, planner: 2 } }
      ]
    },
    {
      text: "キャリアのゴールとして、どちらの姿に惹かれますか？",
      options: [
        { label: "数千人を動かす大型プロジェクトを背負い、ビジネスを成功に導く総責任者", points: { pm: 5, planner: 2 } },
        { label: "自分のスタイルが業界のスタンダードになるような、唯一無二の表現者", points: { designer: 5, cm: 1 } }
      ]
    },
    {
      text: "無意識にやってしまう『思考の癖』はどちら？",
      options: [
        { label: "常に時間を逆算し、次にやるべき最適な段取りを自動的に考えてしまう", points: { pm: 3, cm: 5 } },
        { label: "目に見える現象の裏側にある『本質的な意味』を言葉にしたくなってしまう", points: { planner: 5, designer: 1 } }
      ]
    },
    {
      text: "トラブルにより納期が危うい！あなたの行動原理は？",
      options: [
        { label: "すぐさまクライアントや協力会社に連絡し、全方位の調整で時間を捻出する", points: { pm: 5, cm: 2 } },
        { label: "現場に常駐し、作業工程の無駄を徹底的に削ぎ落として秒単位で効率化する", points: { cm: 5, pm: 1 } }
      ]
    },
    {
      text: "あなたが最も『耐えがたい』と感じる状況は？",
      options: [
        { label: "誰とも関わらず、ただ一人で黙々と数字を打ち込み続ける時間", points: { pm: 4, cm: 3 } },
        { label: "根拠や戦略がなく、ただ『なんとなく』で物事が決まっていく場", points: { planner: 5, designer: 2 } }
      ]
    },
    {
      text: "ディスプレイ業界の仕事の本質は、どちらだと思いますか？",
      options: [
        { label: "巨大な空間を事故なく、計画通りに現出させる『構築の芸術』", points: { cm: 4, pm: 3 } },
        { label: "何もない空間に、物語と命を吹き込み人を魅了する『創造の魔法』", points: { designer: 4, planner: 3 } }
      ]
    },
    {
      text: "新しい素材（マテリアル）に出会った時、脳が考えるのは？",
      options: [
        { label: "「この質感、あのコンセプトに合うかも」という表現の可能性", points: { designer: 5, cm: 3 } },
        { label: "「これ、単価はいくらで、どれくらいの納期で入るか」という調達の現実", points: { pm: 5, cm: 3 } }
      ]
    },
    {
      text: "会議で意見が真っ向から対立。あなたの戦略は？",
      options: [
        { label: "相手の主張の正しさを認めつつ、それを包含した新しい合意点を作り上げる", points: { pm: 4, planner: 2 } },
        { label: "より詳細な調査結果や図解を用い、論理的な一貫性で正当性を証明する", points: { planner: 5, designer: 2 } }
      ]
    },
    {
      text: "あなたを動かす究極のモチベーションは？",
      options: [
        { label: "『プロとして最後までやり遂げる』という責任感と、チームからの信頼", points: { pm: 5, cm: 3 } },
        { label: "『自分にしか作れないものを作る』という表現欲求と、完璧への執着", points: { designer: 5, planner: 3 } }
      ]
    }
  ];

  const roles = {
    pm: {
      title: "プロジェクトマネージャー (PM)",
      subtitle: "Project Manager",
      icon: <UserRound className="w-10 h-10" />,
      color: "border-indigo-600 text-indigo-600", bg: "bg-indigo-50",
      description: "あなたはプロジェクトの『心臓』。クライアントの期待をビジネスに変換し、予算・契約・納期を掌握して、数多のプロを完遂へと導く司令塔です。",
      matrix: {
        skill: "高度な交渉力、損益管理、リスクマネジメント",
        value: "信頼の構築と、プロジェクトの社会的・経済的成功",
        personality: "外交的かつ冷静。板挟みの状況を楽しむ強さを持つ",
        strength: "曖昧な要望を具体的な計画へ翻訳する力",
        weakness: "細部への埋没。常に全体最適を考える必要がある",
        workstyle: "現場、オフィス、会食。縦横無尽に動き回る"
      }
    },
    planner: {
      title: "プランナー",
      subtitle: "Concept Planner",
      icon: <PenTool className="w-10 h-10" />,
      color: "border-amber-500 text-amber-500", bg: "bg-amber-50",
      description: "あなたはプロジェクトの『脳』。世の中の流れを読み、課題の本質を言語化し、空間が担うべき『意味』を論理的に構築する戦略家です。",
      matrix: {
        skill: "マーケット分析、コンセプト立案、言語化・構成力",
        value: "「納得」と「驚き」によって、人の行動や意識を変えること",
        personality: "飽くなき好奇心と俯瞰的な思考. 一貫性を重んじる",
        strength: "バラバラな事象を一本のストーリーに繋ぐ力",
        weakness: "物理的な実現性の軽視。現場との対話が不可欠",
        workstyle: "徹底的なリサーチと考察。資料の美しさにもこだわる"
      }
    },
    designer: {
      title: "デザイナー",
      subtitle: "Visual Designer",
      icon: <Palette className="w-10 h-10" />,
      color: "border-purple-600 text-purple-600", bg: "bg-purple-50",
      description: "あなたはプロジェクトの『魂』。形のない想いを、誰もが息を呑むような視覚的・空間的体験へと昇華させる、執念の表現者です。",
      matrix: {
        skill: "3D・CAD、素材知識、色彩設計、空間構成能力",
        value: "圧倒的な美しさと機能性の高次元での融合",
        personality: "職人気質な探究心と柔軟性。納期ギリギリまで粘る執念",
        strength: "見えないものを『見える形』にする具現化力",
        weakness: "コスト・効率の無視。利益意識とのバランスが鍵",
        workstyle: "モニターに向かう没頭。素材選びやライティングへの執着"
      }
    },
    cm: {
      title: "施工管理 (CM)",
      subtitle: "Product Director",
      icon: <Hammer className="w-10 h-10" />,
      color: "border-orange-600 text-orange-600", bg: "bg-orange-50",
      description: "あなたはプロジェクトの『手』。図面という思想を、寸分違わず現実に構築する現場の王様。Q-C-D-Sを完璧に守り抜く、最高峰の技術者です。",
      matrix: {
        skill: "図面読解、工程構築能力、安全・品質監理、職人力",
        value: "事故ゼロ、予算内、完璧な仕上げによる『具現化』",
        personality: "責任感の塊。現場の空気を瞬時に読み調整する兄貴肌",
        strength: "想定外のトラブルを現場でねじ伏せる即断即決力",
        weakness: "抽象的な議論。常に『具体』で語る必要がある",
        workstyle: "現場常駐、夜間対応、長期出張. ライブ感が日常"
      }
    }
  };

  const handleAnswer = (points) => {
    const newScores = { ...scores };
    Object.keys(points).forEach(key => {
      newScores[key] += points[key];
    });
    setScores(newScores);
    if (step === 19) {
      const res = getResultKey(newScores);
      generateAIContent(roles[res].title, roles[res].subtitle, newScores);
    }
    setStep(step + 1);
  };

  const getResultKey = (currentScores) => {
    const entries = Object.entries(currentScores);
    entries.sort((a, b) => {
      if (b[1] !== a[1]) return b[1] - a[1];
      const priority = { pm: 4, planner: 3, designer: 2, cm: 1 };
      return priority[b[0]] - priority[a[0]];
    });
    return entries[0][0];
  };

  const copyResultToClipboard = () => {
    const resultKey = getResultKey(scores);
    const role = roles[resultKey];
    const text = `【ディスプレイ業界 職種診断結果】\n私の適職は：${role.title} (${role.subtitle})\n${role.description}\n\nProduced by 空間デザイン/ディスプレイ業界の人事@カイ`;
    
    const textArea = document.createElement("textarea");
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      setCopyFeedback(true);
      setTimeout(() => setCopyFeedback(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
    document.body.removeChild(textArea);
  };

  const reset = () => {
    setStep(0);
    setScores({ pm: 0, planner: 0, designer: 0, cm: 0 });
    setAiAdvice("");
    setAiInterview(null);
    setActiveTab('matrix');
  };

  const currentResultKey = useMemo(() => getResultKey(scores), [scores]);

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* イントロダクション */}
      {step === 0 && (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-slate-50">
          <div className="max-w-4xl w-full text-center space-y-12">
            <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-1000">
              <span className="inline-block px-4 py-1 border border-indigo-600 text-indigo-600 text-[10px] font-black tracking-[.3em] uppercase rounded-full">Display Industry Professional Diagnosis</span>
              <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter leading-none text-balance">
                どのプロとして<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600">空間</span>を創るか。
              </h1>
              <p className="max-w-xl mx-auto text-slate-500 text-lg font-medium leading-relaxed">
                ディスプレイ業界の4職種。単なる「憧れ」を、<br />
                あなたの「適性」と「覚悟」に変換するための20の問い。
              </p>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
              {Object.values(roles).map((role, i) => (
                <div key={i} className="bg-white p-4 border border-slate-200 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-slate-400 mb-2">{role.icon}</div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">{role.subtitle}</div>
                </div>
              ))}
            </div>

            <div className="space-y-6 animate-in fade-in duration-1000 delay-500">
              <button
                onClick={() => setStep(1)}
                className="group relative px-12 py-6 bg-slate-900 text-white rounded-full font-black text-xl overflow-hidden shadow-2xl transition-all hover:bg-indigo-600 active:scale-95"
              >
                診断を開始する
                <ArrowRight className="inline-block ml-3 group-hover:translate-x-2 transition-transform" size={24} />
              </button>
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Produced by 空間デザイン/ディスプレイ業界の人事@カイ
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 診断ステップ */}
      {step > 0 && step <= 20 && (
        <div className="min-h-screen flex flex-col bg-white">
          <div className="w-full bg-slate-50 border-b border-slate-100 py-4 px-8 flex justify-between items-center sticky top-0 z-50">
            <div className="flex items-center gap-4">
              <span className="text-[10px] font-black tracking-widest text-slate-400 hidden sm:inline">ANALYSIS</span>
              <div className="w-24 sm:w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 transition-all duration-500"
                  style={{ width: `${(step / 20) * 100}%` }}
                />
              </div>
            </div>
            <span className="text-[10px] font-black text-indigo-600">{step} / 20</span>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center p-6 max-w-4xl mx-auto w-full">
            <div className="w-full space-y-8 sm:space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="space-y-4 sm:space-y-6">
                <div className="text-indigo-600 font-black text-xs sm:text-sm uppercase tracking-tighter">Question {step}</div>
                <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 leading-tight text-balance">
                  {questions[step - 1].text}
                </h2>
              </div>

              <div className="grid gap-4 sm:gap-6">
                {questions[step - 1].options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(option.points)}
                    className="group relative p-6 sm:p-8 text-left bg-white border-2 border-slate-100 rounded-2xl sm:rounded-3xl transition-all hover:border-indigo-600 hover:bg-indigo-50/30 overflow-hidden shadow-sm active:scale-[0.98]"
                  >
                    <div className="flex items-center justify-between relative z-10">
                      <span className="text-lg sm:text-xl font-bold text-slate-700 group-hover:text-indigo-900 pr-6 leading-snug">
                        {option.label}
                      </span>
                      <ArrowRight className="text-slate-200 group-hover:text-indigo-600 transition-transform group-hover:translate-x-2 shrink-0" size={24} />
                    </div>
                  </button>
                ))}
              </div>

              {step > 1 && (
                <button 
                  onClick={() => setStep(step - 1)}
                  className="text-slate-400 hover:text-slate-600 text-xs font-black uppercase tracking-widest flex items-center gap-2 p-2"
                >
                  <ChevronLeft size={16} /> Previous
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 診断結果 */}
      {step === 21 && (
        <div className="min-h-screen bg-slate-50 p-4 sm:p-6 md:p-12">
          <div className="max-w-6xl mx-auto space-y-6 sm:space-y-8 animate-in fade-in duration-1000">
            
            {/* ヒーローリザルト */}
            <div className={`bg-white rounded-[2rem] sm:rounded-[3rem] shadow-2xl overflow-hidden border-t-[12px] ${roles[currentResultKey].color.split(' ')[0]} grid md:grid-cols-12 print:shadow-none print:border-2`}>
              <div className="md:col-span-5 p-8 sm:p-12 md:p-16 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100">
                <div className={`p-6 sm:p-8 rounded-[2rem] sm:rounded-[2.5rem] mb-6 sm:mb-8 shadow-inner ${roles[currentResultKey].bg} text-slate-900`}>
                  {roles[currentResultKey].icon}
                </div>
                <p className="text-indigo-600 font-black tracking-[.3em] text-[10px] uppercase mb-2">Optimal Career Pathway</p>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-slate-900 mb-2 text-center">{roles[currentResultKey].title}</h2>
                <p className="text-base sm:text-lg text-slate-400 font-bold italic tracking-wide">{roles[currentResultKey].subtitle}</p>
              </div>

              <div className="md:col-span-7 p-8 sm:p-12 md:p-16 flex flex-col justify-center bg-slate-50/50">
                <div className="space-y-6 text-center md:text-left">
                  <h3 className="text-xl sm:text-2xl font-black text-slate-900 leading-snug">
                    {roles[currentResultKey].description}
                  </h3>
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 sm:gap-4 print:hidden">
                    <button 
                      onClick={() => setActiveTab('matrix')}
                      className={`px-4 sm:px-6 py-2 rounded-full text-[10px] sm:text-xs font-black tracking-widest transition-all ${activeTab === 'matrix' ? 'bg-slate-900 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-400 hover:border-slate-400'}`}
                    >
                      BASIC MATRIX
                    </button>
                    <button 
                      onClick={() => setActiveTab('ai_advice')}
                      className={`px-4 sm:px-6 py-2 rounded-full text-[10px] sm:text-xs font-black tracking-widest transition-all flex items-center gap-2 ${activeTab === 'ai_advice' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-400 hover:border-indigo-400'}`}
                    >
                      <Sparkles size={14} /> AI ADVISOR
                    </button>
                    <button 
                      onClick={copyResultToClipboard}
                      className="px-4 sm:px-6 py-2 rounded-full text-[10px] sm:text-xs font-black tracking-widest bg-white border border-slate-200 text-slate-400 hover:border-slate-400 flex items-center gap-2 transition-all active:scale-95"
                    >
                      {copyFeedback ? <CheckCircle2 size={14} className="text-green-500" /> : <Copy size={14} />}
                      {copyFeedback ? 'COPIED!' : 'SHARE'}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* コンテンツ切り替えエリア */}
            <div className="bg-white rounded-[2rem] sm:rounded-[3rem] shadow-xl p-8 sm:p-10 md:p-16 border border-slate-100 print:shadow-none print:border-0">
              {activeTab === 'matrix' ? (
                <div className="grid md:grid-cols-2 gap-12 sm:gap-16 animate-in fade-in duration-500">
                  <div className="space-y-12">
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                        Professional Foundation
                      </h4>
                      {[
                        { label: "必須スキル", value: roles[currentResultKey].matrix.skill, icon: <Settings size={18} className="text-indigo-600"/> },
                        { label: "核となる価値観", value: roles[currentResultKey].matrix.value, icon: <Target size={18} className="text-rose-500"/> },
                        { label: "資質・性格", value: roles[currentResultKey].matrix.personality, icon: <User size={18} className="text-amber-500"/> },
                      ].map((item, i) => (
                        <div key={i} className="flex gap-4 sm:gap-6">
                          <div className="mt-1 shrink-0">{item.icon}</div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase">{item.label}</p>
                            <p className="text-slate-800 font-bold text-base sm:text-lg leading-tight">{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-12">
                    <div className="space-y-6">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                        Reality & Growth
                      </h4>
                      {[
                        { label: "特筆すべき強み", value: roles[currentResultKey].matrix.strength, icon: <CheckCircle2 size={18} className="text-emerald-500"/> },
                        { label: "意識すべき弱点", value: roles[currentResultKey].matrix.weakness, icon: <AlertCircle size={18} className="text-slate-300"/> },
                        { label: "働き方の実態", value: roles[currentResultKey].matrix.workstyle, icon: <Clock size={18} className="text-indigo-400"/> },
                      ].map((item, i) => (
                        <div key={i} className="flex gap-4 sm:gap-6">
                          <div className="mt-1 shrink-0">{item.icon}</div>
                          <div className="space-y-1">
                            <p className="text-[10px] font-black text-slate-400 uppercase">{item.label}</p>
                            <p className="text-slate-800 font-bold text-base sm:text-lg leading-tight">{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="animate-in fade-in duration-500">
                  {loadingAI ? (
                    <div className="flex flex-col items-center justify-center py-24 space-y-4">
                      <Loader2 className="animate-spin text-indigo-600" size={48} />
                      <p className="text-slate-400 font-bold tracking-widest text-xs">AI IS ANALYZING YOUR POTENTIAL...</p>
                    </div>
                  ) : (
                    <div className="grid md:grid-cols-12 gap-12">
                      <div className="md:col-span-7 space-y-8">
                        <div className="bg-indigo-50 border border-indigo-100 p-6 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] relative shadow-inner">
                          <Sparkles className="absolute -top-4 -left-4 text-indigo-600 bg-white p-2 rounded-xl shadow-lg" size={32} />
                          <h4 className="text-lg font-black text-indigo-900 mb-4 text-center md:text-left">✨ AI キャリアアドバイス</h4>
                          <p className="text-indigo-900/80 leading-relaxed font-medium italic text-base sm:text-lg whitespace-pre-wrap">
                            {aiAdvice}
                          </p>
                        </div>
                      </div>
                      <div className="md:col-span-5 space-y-6">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 border-b border-slate-100 pb-2">
                          <ListChecks size={16} className="text-indigo-600" /> 面接対策（想定質問）
                        </h4>
                        {aiInterview?.map((item, i) => (
                          <div key={i} className="group p-5 sm:p-6 border border-slate-100 rounded-xl sm:rounded-2xl hover:border-indigo-200 hover:bg-slate-50 transition-all">
                            <div className="text-[10px] font-black text-indigo-600 mb-2">QUESTION {i+1}</div>
                            <p className="font-bold text-slate-900 mb-3 text-sm sm:text-base">{item.q}</p>
                            <div className="animate-in fade-in duration-300">
                              <p className="text-[10px] sm:text-xs text-slate-500 bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                                <span className="font-black text-indigo-600 mr-2">TIP:</span> {item.tip}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* フッターアクション */}
            <div className="flex flex-col md:flex-row gap-4 sm:gap-6 justify-center items-center py-12 print:hidden">
              <button
                onClick={reset}
                className="flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-5 bg-white border-2 border-slate-200 text-slate-400 rounded-full font-black text-sm hover:border-slate-900 hover:text-slate-900 transition-all active:scale-95"
              >
                <RefreshCw size={18} /> 最初からやり直す
              </button>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-3 px-8 sm:px-10 py-4 sm:py-5 bg-slate-900 text-white rounded-full font-black text-sm hover:bg-slate-800 transition-all shadow-xl active:scale-95"
              >
                診断結果をPDFで保存
              </button>
            </div>

            <div className="text-center space-y-3 pb-8">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                Produced by 空間デザイン/ディスプレイ業界の人事@カイ
              </p>
              <p className="text-[10px] font-bold text-slate-300 uppercase tracking-[.5em]">
                © 2025 Display Career Lab / Powered by Gemini 2.5 Flash
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;