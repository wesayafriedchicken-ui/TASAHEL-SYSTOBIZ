import React, { useState, useEffect, useRef } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  Wand2,
  CheckCircle,
  HelpCircle,
  FileText,
  MapPin,
  Target,
  BookOpen,
  List,
  AlertTriangle,
  Megaphone,
  Database,
  GraduationCap,
  ChevronRight,
  ArrowRight,
  LayoutGrid,
  Terminal,
  Play,
  Pause,
  Activity,
  Cpu,
  Layers,
  Search,
  RefreshCw,
  Plus,
  Trash2,
  MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface Answer {
  question: string;
  answer: string;
}

export default function AIBusinessModule() {
  const [step, setStep] = useState<1 | 2 | 3>(1);

  // History States
  const [sessions, setSessions] = useState<any[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/ai-business/sessions", {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "x-user-id": localStorage.getItem("userId") || "1"
        }
      });
      if (res.ok) {
        const list = await res.json();
        setSessions(list);
      }
    } catch (err) {
      console.error("Error fetching sessions:", err);
    }
  };

  const handleStartNewSession = () => {
    setStep(1);
    setSeedInput("");
    setAnswers([]);
    setCurrentQuestion("");
    setCurrentAnswer("");
    setResultData(null);
    setScopeDocument("");
    setAgentAnalysis("");
    setShowScopePreview(false);
    setCurrentSessionId(null);
    setSeedStatus("idle");
  };

  const handleLoadSession = (session: any) => {
    setCurrentSessionId(session.id);
    setSeedInput(session.seed_input);
    const loadedAnswers = Array.isArray(session.answers) ? session.answers : [];
    setAnswers(loadedAnswers);
    setSeedStatus("idle");
    
    if (session.result_data) {
      setScopeDocument(session.scope_document || "");
      setAgentAnalysis(session.agent_analysis || "");
      setResultData(session.result_data);
      setShowScopePreview(true);
      setStep(3);
    } else if (session.is_satisfied || loadedAnswers.length >= 4) {
      setScopeDocument(session.scope_document || "");
      setAgentAnalysis(session.agent_analysis || "");
      setShowScopePreview(true);
      setStep(2);
    } else {
      setStep(2);
      setShowScopePreview(false);
      
      const isAr = /[\u0600-\u06FF]/.test(session.seed_input);
      const count = loadedAnswers.length;
      let nextQ = "";
      if (count === 0) {
        nextQ = isAr 
          ? "سؤال رائع! ما هي الفئة المستهدفة بالتحديد لمشروعك (مثال: أفراد، شركات، فئة فاخرة) وفي أي نطاق جغرافي ترغب في البدء أولاً؟" 
          : "Excellent idea! Who is your primary target audience?";
      } else if (count === 1) {
        nextQ = isAr 
          ? "ممتاز جداً. ما هي طبيعة نموذج الإيرادات والأسعار المقترحة؟ هل تفضل الاشتراكات المتكررة أم الدفع العادي لكل طلب؟" 
          : "Got it! What is your planned revenue model?";
      } else if (count === 2) {
        nextQ = isAr 
          ? "رؤية واضحة! ما هي أكبر ميزة تنافسية تميز عملك عن المنافسين المباشرين المتواجدين حالياً في السوق؟" 
          : "Clear vision! What is your absolute biggest competitive advantage?";
      } else {
        nextQ = isAr 
          ? "رائع! لقد جمعنا الصورة الكاملة تقريباً لتأسيس خطتك الاستراتيجية." 
          : "We have gathered enough insights.";
      }
      setCurrentQuestion(nextQ);
    }
  };

  const handleDeleteSession = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/ai-business/sessions/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "x-user-id": localStorage.getItem("userId") || "1"
        }
      });
      if (res.ok) {
        if (currentSessionId === id) {
          handleStartNewSession();
        }
        fetchSessions();
      }
    } catch (err) {
      console.error("Error deleting session:", err);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  // Step 1: Seed Idea Text
  const [seedInput, setSeedInput] = useState("");

  // Step 2: Refine Chat State
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState("");
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Step 3: Big Bang Generation States
  const [generationLoading, setGenerationLoading] = useState(false);
  const [loadingPhrase, setLoadingPhrase] = useState("");
  const [resultData, setResultData] = useState<any>(null);

  // Live progress alerts via real WebSockets (النشر التدريجي الحي)
  const [liveStreamAlerts, setLiveStreamAlerts] = useState<{ id: string; step: number; message: string; timestamp: Date }[]>([]);
  const liveProgressEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!generationLoading) {
      setLiveStreamAlerts([]);
      return;
    }

    let socket: WebSocket;
    let reconnectTimeout: NodeJS.Timeout;

    const connectProgressServer = () => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        socket = new WebSocket(`${protocol}//${window.location.host}`);

        socket.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === "BUSINESS_GENERATION_PROGRESS") {
              setLiveStreamAlerts((prev) => {
                // Ignore identical duplicates to keep feed clean
                if (prev.some((item) => item.message === payload.message)) {
                  return prev;
                }
                return [
                  ...prev,
                  {
                    id: Math.random().toString(36).substring(7),
                    step: payload.step,
                    message: payload.message,
                    timestamp: new Date()
                  }
                ];
              });
            }
          } catch (e) {
            console.error("Error parsing generation progress message:", e);
          }
        };

        socket.onclose = () => {
          reconnectTimeout = setTimeout(() => {
            if (generationLoading) connectProgressServer();
          }, 2000);
        };

        socket.onerror = (err) => {
          console.error("Socket error inside Progress Stream channel:", err);
        };
      } catch (err) {
        console.error("Could not construct Progress socket:", err);
      }
    };

    connectProgressServer();

    return () => {
      if (socket) socket.close();
      clearTimeout(reconnectTimeout);
    };
  }, [generationLoading]);

  // Keep live streaming alerts scrolled to bottom
  useEffect(() => {
    if (liveProgressEndRef.current) {
      liveProgressEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [liveStreamAlerts.length]);

  // Selected Result Category Tab
  const [activeTab, setActiveTab] = useState<"structure" | "ops" | "growth" | "knowledge" | "board_room" | "agent_simulation">("structure");

  // Multi-Agent System & Board of Directors States
  const [scopeDocument, setScopeDocument] = useState("");
  const [agentAnalysis, setAgentAnalysis] = useState("");
  const [showScopePreview, setShowScopePreview] = useState(false);
  const [loadingAgentIndex, setLoadingAgentIndex] = useState(0);

  // Agent Simulation Live Log Feed states
  const [simPlaying, setSimPlaying] = useState(true);
  const [simSpeed, setSimSpeed] = useState<1 | 2 | 5 | 999>(2);
  const [displayedLogs, setDisplayedLogs] = useState<any[]>([]);
  const [simAgentFilter, setSimAgentFilter] = useState<string>("all");
  const [simSearchTerm, setSimSearchTerm] = useState("");
  const [simLogIndex, setSimLogIndex] = useState(0);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Inline AI Refinement Modal / Trigger State
  const [editingItem, setEditingItem] = useState<{
    itemType: string;
    itemId: string | number;
    currentText: string;
    targetField: string;
    parentIndex?: number;
    childIndex?: number;
  } | null>(null);
  const [promptInstruction, setPromptInstruction] = useState("");
  const [isUpdatingField, setIsUpdatingField] = useState(false);
  const [manualEditText, setManualEditText] = useState("");
  const [seedStatus, setSeedStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  // Reassuring messages for loading screen
  const loadingPhrases = [
    "جاري تحليل فكرتك وبناء الهيكل التشغيلي...",
    "يتم الآن كتابة إجراءات التشغيل القياسية (SOPs)...",
    "جاري تصميم خريطة تدفق العمليات (BPMN)...",
    "جاري جدولة المهام التأسيسية الفورية للبيزنس...",
    "جاري توقع المخاطر وبناء سجل المخاطر والحلول المبتكرة...",
    "توليد الخطة التسويقية الاستباقية وصناعة المحتوى...",
    "تغذية قاعدة المعرفة بالسياسات العامة واللوائح المتكاملة...",
    "بناء المسار التدريبي الرقمي وصياغة أسئلة تقييم الموظفين..."
  ];

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (generationLoading) {
      let counter = 0;
      setLoadingPhrase(loadingPhrases[0]);
      setLoadingAgentIndex(0);
      interval = setInterval(() => {
        counter = (counter + 1) % loadingPhrases.length;
        setLoadingPhrase(loadingPhrases[counter]);
        // Progressively activate different agents in the simulation
        setLoadingAgentIndex((prev) => (prev + 1) % 5);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [generationLoading]);

  // Auto-scroll virtual terminal to bottom as new logs arrive
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [displayedLogs.length, activeTab]);

  // Terminal Log sequence simulation hook
  useEffect(() => {
    if (activeTab !== "agent_simulation" || !resultData || !simPlaying) return;

    const fullLogs = getSimulationLogs(resultData, seedInput, answers);
    if (simLogIndex >= fullLogs.length) {
      setSimPlaying(false);
      return;
    }

    const speedDelays = {
      1: 1500,
      2: 700,
      5: 250,
      999: 10
    };
    const delay = speedDelays[simSpeed] || 700;

    const timer = setTimeout(() => {
      setDisplayedLogs((prev) => [...prev, fullLogs[simLogIndex]]);
      setSimLogIndex((prev) => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [activeTab, simPlaying, simSpeed, simLogIndex, resultData, seedInput, answers]);

  const restartSimulation = () => {
    setSimLogIndex(0);
    setDisplayedLogs([]);
    setSimPlaying(true);
  };

  const seedTemplates = [
    {
      label: "شركة سياحة فاخرة",
      text: "أريد فتح شركة سياحة وترفيه تركز على الرحلات العلاجية والاستشفائية في سياق فاخر ومستدام واستهداف السياح من الخليج العربي."
    },
    {
      label: "متجر أدوات مطبخ جرانيت",
      text: "متجر إلكتروني لبيع أدوات المطبخ المصنوعة من الجرانيت الطبيعي عالي الجودة مع توفير مقاطع فيديو تفاعلية لطرق الطهي."
    },
    {
      label: "تطبيق لاندري ذكي بمشتركين",
      text: "تطبيق غسيل ملابس يعتمد على نموذج الاشتراكات الشهرية مع استلام وتوصيل مجاني باستخدام سيارات كهربائية صديقة للبيئة."
    }
  ];

  // Submit Seed Input to start interactive chats
  const handleStartRefinement = async () => {
    if (!seedInput.trim()) return;
    setChatLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/ai-business/refine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
          "x-user-id": localStorage.getItem("userId") || "1"
        },
        body: JSON.stringify({ seedInput })
      });

      if (res.ok) {
        const data = await res.json();
        setCurrentQuestion(data.question);
        setStep(2);

        // CREATE dynamic initial session history in database
        try {
          const sessionSaveRes = await fetch("/api/ai-business/sessions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: token ? `Bearer ${token}` : "",
              "x-user-id": localStorage.getItem("userId") || "1"
            },
            body: JSON.stringify({
              seed_input: seedInput,
              answers: [],
              is_satisfied: false
            })
          });
          if (sessionSaveRes.ok) {
            const sData = await sessionSaveRes.json();
            setCurrentSessionId(sData.session.id);
            fetchSessions();
          }
        } catch (saveErr) {
          console.error("Failed to save initial session history:", saveErr);
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  // Submit Answer & Fetch Next Question
  const handleAnswerSubmit = async () => {
    if (!currentAnswer.trim()) return;

    const updatedAnswers = [...answers, { question: currentQuestion, answer: currentAnswer }];
    setAnswers(updatedAnswers);
    setCurrentAnswer("");
    setChatLoading(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/ai-business/refine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
          "x-user-id": localStorage.getItem("userId") || "1"
        },
        body: JSON.stringify({ seedInput, answers: updatedAnswers })
      });

      if (res.ok) {
        const data = await res.json();
        const satisfied = data.is_satisfied || updatedAnswers.length >= 4;
        
        if (satisfied) {
          // Store scope document and transit to scope preview
          setScopeDocument(data.scopeDocument);
          setAgentAnalysis(data.agentAnalysis);
          setShowScopePreview(true);
        } else {
          setCurrentQuestion(data.question);
        }

        // UPDATE the current persisted session!
        if (currentSessionId) {
          try {
            await fetch("/api/ai-business/sessions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
                "x-user-id": localStorage.getItem("userId") || "1"
              },
              body: JSON.stringify({
                id: currentSessionId,
                seed_input: seedInput,
                answers: updatedAnswers,
                is_satisfied: satisfied,
                scope_document: satisfied ? data.scopeDocument : null,
                agent_analysis: satisfied ? data.agentAnalysis : null
              })
            });
            fetchSessions();
          } catch (updateErr) {
            console.error("Failed to update session history:", updateErr);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  // Skip the remaining questions and force compile the Scope Document
  const handleBypassToScope = async () => {
    setChatLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/ai-business/refine", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
          "x-user-id": localStorage.getItem("userId") || "1"
        },
        body: JSON.stringify({ seedInput, answers, bypassForceSatisfied: true })
      });

      if (res.ok) {
        const data = await res.json();
        setScopeDocument(data.scopeDocument);
        setAgentAnalysis(data.agentAnalysis);
        setShowScopePreview(true);

        // UPDATE the current persisted session to satisfied!
        if (currentSessionId) {
          try {
            await fetch("/api/ai-business/sessions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
                "x-user-id": localStorage.getItem("userId") || "1"
              },
              body: JSON.stringify({
                id: currentSessionId,
                seed_input: seedInput,
                answers: answers,
                is_satisfied: true,
                scope_document: data.scopeDocument,
                agent_analysis: data.agentAnalysis
              })
            });
            fetchSessions();
          } catch (updateErr) {
            console.error("Failed to update session on bypass:", updateErr);
          }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setChatLoading(false);
    }
  };

  // Run the core Big Bang Generation Seeding Engine
  const handleBigBangGeneration = async (finalAnswers: Answer[]) => {
    setGenerationLoading(true);
    setStep(3);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/ai-business/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
          "x-user-id": localStorage.getItem("userId") || "1"
        },
        body: JSON.stringify({ seedInput, answers: finalAnswers })
      });

      if (res.ok) {
        const payload = await res.json();
        setResultData(payload.data);

        // Auto-save the newly generated result_data into the session history
        if (currentSessionId) {
          try {
            const token = localStorage.getItem("token");
            await fetch("/api/ai-business/sessions", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: token ? `Bearer ${token}` : "",
                "x-user-id": localStorage.getItem("userId") || "1"
              },
              body: JSON.stringify({
                id: currentSessionId,
                seed_input: seedInput,
                answers: finalAnswers,
                is_satisfied: true,
                scope_document: scopeDocument,
                agent_analysis: agentAnalysis,
                result_data: payload.data
              })
            });
            // Re-fetch sessions to keep lists synced
            const listRes = await fetch("/api/ai-business/sessions", {
              headers: {
                Authorization: token ? `Bearer ${token}` : "",
                "x-user-id": localStorage.getItem("userId") || "1"
              }
            });
            if (listRes.ok) {
              const listData = await listRes.json();
              setSessions(listData.sessions || []);
            }
          } catch (updateErr) {
            console.error("Failed to auto-save generated plan into session historical object:", updateErr);
          }
        }

        // Feed Business Model to local storage keys to sync the other application modules
        if (payload.data?.businessModel) {
          const bm = payload.data.businessModel;
          if (bm.okrs) localStorage.setItem("core_strategic_okrs", JSON.stringify(bm.okrs));
          if (bm.swot) localStorage.setItem("core_strategic_swot", JSON.stringify(bm.swot));
          if (bm.competitors) localStorage.setItem("core_strategic_competitors", JSON.stringify(bm.competitors));
          if (bm.milestones) localStorage.setItem("core_strategic_milestones", JSON.stringify(bm.milestones));
          localStorage.setItem("core_value_delivery_score", "90");
          localStorage.setItem("core_revenue_streams_health", "Excellent");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setGenerationLoading(false);
    }
  };

  const handleLaunchDemo = () => {
    const input = "أريد فتح شركة سياحة وترفيه تركز على الرحلات العلاجية والاستشفائية في سياق فاخر ومستدام واستهداف السياح من الخليج العربي.";
    setSeedInput(input);
    const mockAns = [
      { question: "ما هي الفئة المستهدفة الأساسية لشركتكم؟", answer: "السياح والوفود بملاءة مالية عالية من الخليج العربي الباحثين عن برامج استشفاء متكاملة ونقاهة." },
      { question: "ما هي قنوات الحجز والتواصل المفضلة؟", answer: "موقع حجز فخم وتواصل VIP عبر الهواتف وتطبيق متابعة صحية متكامل." }
    ];
    setAnswers(mockAns);

    const demoPayload = {
      businessModel: {
        okrs: [
          {
            objective: "إطلاق المنصة الرقمية لرحلات الاستشفاء والسياحة الفاخرة واختبار جودة خدمة أول 50 عميل",
            key_results: [
              "التعاقد مع 15 منتجعاً صحياً وفندقاً ذو تصنيف 5 نجوم في أول 60 يوماً",
              "بناء واجهة حجز تجريبية للهواتف الذكية بنسبة رضا عملاء تفوق 95%"
            ]
          },
          {
            objective: "تأسيس الشراكات الاستراتيجية ووكالات السفر بالخليج لضمان تدفق مستمر للعملاء",
            key_results: [
              "توقيع 3 مذكرات تفاهم مع وكلاء سفر وسياحة متميزين في المملكة العربية السعودية والكويت",
              "تحقيق مبيعات أولية بقيمة 80 ألف دولار في الربع الأول"
            ]
          }
        ],
        swot: {
          strengths: [
            "تقديم مفهوم فريد يدمج بين العلاج الطبيعي والتجارب الترفيهية الفاخرة",
            "تواجد شبكة علاقات مميزة مع أرقى المصحات والمنتجعات الصحية الصديقة للبيئة",
            "فريق تواصل ناطق بلغات متعددة لخدمة كبار الشخصيات VIP"
          ],
          weaknesses: [
            "ارتفاع التكلفة التأسيسية للحملات التسويقية التي تستهدف الفئات ذات الملاءة المالية العالية",
            "العلاقات التعاقدية في البداية تحتاج إلى وقت طويل للاعتماد القانوني",
            "الاعتماد على مواسم معينة قد يؤدي لتذبذب في الإيرادات السنوية"
          ],
          opportunities: [
            "زيادة الوعي العالمي ببرامج الاستشفاء والصحة الوقائية بعد كورونا",
            "نمو القوة الشرائية للسياح العرب الباحثين عن الخصوصية والراحة المتكاملة",
            "الاعتماد على التقنيات الحديثة لعرض الرحلات بالذكاء الاصطناعي وبواقع افتراضي 3D"
          ],
          threats: [
            "حدوث اضطرابات جيوسياسية أو أزمات سفر جوية تؤثر على حركة الطيران العالمي",
            "دخول منافسين تقليديين كبار يمتلكون ميزانيات ضخمة في سوق السياحة الفاخرة",
            "تغير تفضيلات العملاء المفاجئة نحو وجهات محلية أرخص كلفة"
          ]
        },
        competitors: [
          {
            name: "شركة المسافر بلس (Almosafer Plus)",
            strengths: "تغطية عالمية واسعة ونظام حجز سريع وميزانية تسويقية عملاقة",
            weaknesses: "غياب التخصيص الدقيق لرحلات الاستشفاء والتركيز على السفر العام فقط دون برامج طبية مخصصة",
            edge: "نقوم بتخصيص برنامج رعاية متكامل (تغذية، جلسات طبيعية، ترفيه بيئي) ومصحوب بمرافق شخصي معتمد"
          },
          {
            name: "هيلث ترافل العالمية (Health Travel)",
            strengths: "خبرة طويلة وعلاقات مباشرة بأوروبا وجنوب شرق آسيا",
            weaknesses: "ضعف الدعم باللغة العربية وعدم ملاءمة باقاتهم للخصوصية المطلوبة للعائلات الخليجية",
            edge: "باقات متكاملة تراعي العادات الثقافية العربية وبدعم وخدمة تواصل على مدار الساعة 24/7"
          }
        ],
        milestones: [
          { title: "توقيع الشراكات وتجهيز المصحات", date: "2026-06-15", description: "توقيع العقود الحصرية مع أول 10 مصحات طبيعية صديقة للبيئة." },
          { title: "إطلاق منصة الحجز وتجربة الـ VIP", date: "2026-08-01", description: "تفعيل الموقع الإلكتروني وتطبيق الهاتف واختبار تجربة حجز حية كبار الشخصيات." },
          { title: "انطلاق أول فوج سياحي رسمي", date: "2026-09-10", description: "استقبال أول قروب استشفائي فاخر من منطقة الخليج وتقديم رعاية تامة." }
        ]
      },
      sop: {
        title: "إجراء تشغيل حجز وتنسيق رحلات الاستشفاء الفاخرة للعملاء",
        process_type: "إدارة العمليات والرحلات",
        objective: "ضمان تجربة حجز فائقة ومتابعة رعاية دقيقة لكل عميل VIP من لحظة التسجيل حتى العودة بأمان.",
        scope: "يطبق هذا الإجراء على فريق المبيعات، منسقي الرحلات، والمرافقين الميدانيين.",
        roles_responsibilities: "مدير العمليات (مسؤول عن تأكيد الحجوزات)، منسق الخدمة (تخصيص الخطة الصحية)، المرافق الشخصي (التواجد الميداني).",
        kpis: "معدل الرضا عن الرحلة > 95%، صفر شكاوى متعلقة بالاستقبال، سرعة الاستجابة لطلبات العميل خلال 5 دقائق.",
        steps: [
          { step_number: 1, step_description: "استلام طلب السفر وتوجيه مستشار الصحة للتواصل مع العميل لتحديد الاحتياجات الطبية والأذواق الترفيهية الخاصة", expected_result: "ملف صحي وتفضيلات العميل منجزة بالكامل في النظام" },
          { step_number: 2, step_description: "تصميم مسار الرحلة المخصص مشتملاً على المصحة المقترحة والأنشطة والوجبات والرحلات الجانبية وعرضه على العميل للمصادقة", expected_result: "موافقة خطية من العميل على برنامج الرحلة والأسعار" },
          { step_number: 3, step_description: "إجراء الحجوزات الرسمية مع الفنادق والمصحات وسيارات الدفع الرباعية الفخمة وتأكيد التذاكر والتأشيرات اللازمة", expected_result: "تثبيت كافة الحجوزات وإصدار الفواتير وكتيب الرحلة" },
          { step_number: 4, step_description: "استقبال العميل بمركبة كهربائية فاخرة من صالة الاستقبال الخاصة بالمطار وبدء تفعيل خطة الرفاهية الميدانية", expected_result: "عميل VIP مستقر ومستمتع بالخدمة دون أي تأخير" }
        ]
      },
      raci: [
        { step_number: 1, role_name: "مستشار المبيعات والصحة", role_type: "R" },
        { step_number: 2, role_name: "مدير العمليات", role_type: "A" },
        { step_number: 3, role_name: "منسق علاقات المصحات", role_type: "C" },
        { step_number: 4, role_name: "المرافق الميداني والخدمات اللوجستية", role_type: "R" }
      ],
      tasks: [
        { title: "إبرام عقود التأمين الطبي الفاخر للرحلات الاستشفائية", description: "التواصل مع شركة تأمين رائدة لتوفير حماية طبية تامة للعملاء في الوجهات المحددة.", priority: "high" },
        { title: "تدريب مرافقي الرحلات على مهارات البروتوكول والإتيكيت VIP", description: "عقد ورشة عمل حية لمدة 3 أيام للارتقاء بجودة وأسلوب تواصل فريق الاستقبال والمرافقة.", priority: "medium" },
        { title: "توقيع اتفاقية نقل مع كبرى شركات الليموزين الفاخر", description: "ترتيب الحصول على أسطول سيارات حديث مع سائقين مدربين لخدمة النقل الأرضي.", priority: "high" }
      ],
      risks: [
        { name: "إصابة أحد السياح بنكسة صحية خلال الرحلة الاستشفائية", description: "حدوث مضاعفات أو عدم ملاءمة لبعض العلاجات الطبيعية للعميل.", category: "Operational", probability: 2, impact: 4, mitigation_plan: "تأمين طبي فوري والربط مع أقرب مستشفى دولي وتوفير طبيب استشاري مرافق للحالات الخاصة." },
        { name: "رفض التعويل على مصحة معينة أو إلغاء الحجز الفندقي المفاجئ", description: "فشل الطرف الآخر في الالتزام بأماكن الحجز المقررة نتيجة لخصومات أو تضارب مواعيد.", category: "Market", probability: 1, impact: 5, mitigation_plan: "توقيع عقود حازمة مع المصحات تشتمل على شروط جزائية رادعة والتعاقد مع فنادق بديلة وجاهزة بدعم سريع." }
      ],
      marketing: {
        campaign_title: "حملة استنشق الفخامة والصحة",
        goal: "جذب 200 طلب استفسار للرحلات الطبية في بلاد الاستجمام الفاخر وتحويل 15 حاجزاً مؤكداً.",
        platform: "شبكات التواصل المستهدفة لكبار المستثمرين ورجال الأعمال بالخليج",
        posts: [
          {
            title: "بوست استجمام العقول والأبدان",
            platform: "LinkedIn",
            post_content: `هل تبحث عن الملاذ المثالي لراحة عقلك وبدنك بعيداً عن صخب العمل؟ 🌿✨\n\nنوفر لك في 'The Business Core' تجربة استشفاء فاخرة مصممة خصيصاً لتناسب احتياجات صحتك الجسدية والنفسية، بالتعاون مع أرقى منتجعات الـ 5 نجوم الصديقة للبيئة.\n\nرعاية شاملة، وتغذية مخصصة، وجلسات علاج طبيعي وسط الطبيعة البكر مع خصوصية تامة تلائم نمط حياتك.\n\nرابط حجز باقتك الفاخرة: [ابدأ تصميم رحلتك الآن]`
          }
        ]
      },
      kb: [
        {
          title: "السياسات العامة وإرشادات السياحة الاستشفائية للعملاء وتغطيتها الطبية",
          content: `### دليل سياسات السفر الاستشفائي للعملاء\nمرحبًا بك في دليلك الشامل لتعليمات وسياسات رحلات السياحة الاستشفائية الخاصة بك. يهدف هذا الملف إلى تبيان شروط الخدمة وتوفير بيئة سفر آمنة وصحية تماماً.\n\n#### 1. التدابير والبروتوكولات الصحية والإجراءات المسبقة\n- **الفحص الطبي التمهيدي**: يجب على كل مسافر تقديم تقرير طبي لا يتعدى عُمره 30 يوماً يفصل حالته الصحية والحساسية والعلاجات الحالية.\n- **تأمين السفر الطبي الدولي**: تشمل الباقة تأميناً ضد العوارض الطبية الطارئة بمستحقات عالية في جهة السفر.`
        }
      ],
      training: {
        course_title: "دورة بروتوكول الضيافة الفاخرة ووكلاء تنظيم الرحلات الطبية",
        description: "برنامج تدريبي مخصص لتأهيل موظفي المبيعات والمنسقين الميدانيين على السلوك اللازم للتعامل مع السياحة الفخمة.",
        objectives: "معرفة مهارات التواصل الراقي، إدارة الأزمات الصحية بالميدان، وترتيب رعاية الـ VIP.",
        quiz_title: "اختبار معايير جودة الضيافة والاستشفاء",
        quiz_description: "اختبر فهمك لسياسات التعامل، وأساليب استقبال كبار الشخصيات ومتابعة احتياجاتهم الصحية بدقة.",
        questions: [
          {
            id: 1,
            question: "ما هو الإجراء الفوري في حال حدوث وعكة صحية طارئة لأحد سياح الـ VIP؟",
            options: [
              "الطلب من العميل أخذ قسط من الراحة والانتظار لليوم التالي",
              "الاتصال الفوري بخط الطوارئ الطبي المربوط بالباقة ونقله فورًا بمركبة الإسعاف المجهزة وتفعيل الرعاية الطبية",
              "إلغاء الرحلة بالكامل فوراً والطلب من العميل المغادرة الفردية"
            ],
            answer: "الاتصال الفوري بخط الطوارئ الطبي المربوط بالباقة ونقله فورًا بمركبة الإسعاف المجهزة وتفعيل الرعاية الطبية",
            score: 10
          }
        ]
      },
      boardMeetingTranscript: [
        {
          agent: "المايسترو والموجه (CEO)",
          role: "المنسق العام للمجلس الافتراضي",
          status: "COMMITTED",
          text: "الزملاء الأعزاء، تم تلقي فكرة العميل لبناء شركة سفر وسياحة علاجية فاخرة. قمت بصياغة الأهداف الاستراتيجية OKRs وتوزيع الصلاحيات بالتناصف والتناظر لضمان مزامنة ممتازة عبر قاعدة البيانات وقواعد مايو 2026 الصارمة. أريد المتابعة منكم الآن."
        },
        {
          agent: "أخصائي هندسة العمليات (Process)",
          role: "مهندس الإجراءات والـ SOPs",
          status: "COMPLETED",
          text: "لقد تفاعلت مع وثيقة النطاق وقمت بحقن الإجراء التشغيلي القياسي للسياحة الفاخرة (SOPs) في جدول db.sops. يشمل ذلك 4 خطوات دقيقة لترحيل ومتابعة عملاء VIP منذ وطأة أقدامهم للمطار حتى المغادرة."
        },
        {
          agent: "أخصائي تنظيم المشاريع (PM)",
          role: "مدير الكانبان والـ RACI",
          status: "SYNCHRONIZED",
          text: "ممتاز. لقد قمت بمزامنة مصفوفة المسؤوليات RACI وتوزيع المهام التأسيسية الهامة مثل عقود التأمين الفاخر وتدريبات البروتوكول ومرافقي الرحلات وحفظها كمهام نشطة تظهر للفريق مباشرة عبر موديول لوحة الأعمال."
        },
        {
          agent: "أخصائي معالجة المخاطر (Risk/QA)",
          role: "ضمان الجودة CAPA",
          status: "APPROVED",
          text: "قمت ببناء تحليلات المخاطر الاستباقية كإصابات النكسة الطبية لضمان جودة وأمان خدمات العملاء."
        },
        {
          agent: "أخصائي تطوير المبيعات والنمو (Growth)",
          role: "مدير التسويق والـ CRM",
          status: "DEPLOYED",
          text: "رائع جداً. قمت بتسييل هذه الاستراتيجيات عبر حملة 'استنشق الفخامة والصحة' التسويقية وصياغة منشورات جذابة وحفظها بجدول الحملات والـ CRM بنجاح."
        }
      ]
    };

    setResultData(demoPayload);

    // Sync to local storage
    if (demoPayload.businessModel) {
      const bm = demoPayload.businessModel;
      localStorage.setItem("core_strategic_okrs", JSON.stringify(bm.okrs));
      localStorage.setItem("core_strategic_swot", JSON.stringify(bm.swot));
      localStorage.setItem("core_strategic_competitors", JSON.stringify(bm.competitors));
      localStorage.setItem("core_strategic_milestones", JSON.stringify(bm.milestones));
      localStorage.setItem("core_value_delivery_score", "95");
      localStorage.setItem("core_revenue_streams_health", "Excellent");
    }

    setScopeDocument("وثيقة نطاق عمل استثنائية مرنة وموثقة لتشغيل شركة سياحة وأسفار علاجية تستهدف العوائل الخليجية الفخمة.");
    setAgentAnalysis("تنسيق سياحي محكم مدعوم بمصادر وقواعد معلوماتية خصبة ومثالي لمستهدفي منطقة دول الخليج العربي VIP.");
    setStep(3);
    setActiveTab("agent_simulation");
    setSimLogIndex(0);
    setDisplayedLogs([]);
    setSimPlaying(true);
  };

  // Inline AI Adjustment Trigger
  const triggerInlineEdit = (
    itemType: string,
    itemId: string | number,
    currentText: string,
    targetField: string,
    parentIdx?: number,
    childIdx?: number
  ) => {
    setEditingItem({ itemType, itemId, currentText, targetField, parentIndex: parentIdx, childIndex: childIdx });
    setPromptInstruction("");
    setManualEditText(currentText);
  };

  const saveCurrentSessionEdits = async (latestData: any) => {
    if (!currentSessionId) return;
    try {
      const token = localStorage.getItem("token");
      await fetch("/api/ai-business/sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
          "x-user-id": localStorage.getItem("userId") || "1"
        },
        body: JSON.stringify({
          id: currentSessionId,
          seed_input: seedInput,
          answers: answers,
          is_satisfied: true,
          scope_document: scopeDocument,
          agent_analysis: agentAnalysis,
          result_data: latestData
        })
      });
      // Fetch sessions list without full reload
      const res = await fetch("/api/ai-business/sessions", {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
          "x-user-id": localStorage.getItem("userId") || "1"
        }
      });
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (err) {
      console.error("Failed to sync edited session:", err);
    }
  };

  const handleSaveManualEdit = async () => {
    if (!editingItem) return;

    // Mutate resultData state locally so the changes are immediately visible
    const copyResult = { ...resultData };
    const updatedText = manualEditText;

    if (editingItem.itemType === "swot") {
      const field = editingItem.targetField; // e.g. strengths
      const idx = editingItem.parentIndex ?? 0;
      if (copyResult.businessModel?.swot?.[field]) {
        copyResult.businessModel.swot[field][idx] = updatedText;
      }
    } else if (editingItem.itemType === "okr") {
      const pIdx = editingItem.parentIndex ?? 0;
      if (editingItem.targetField === "objective") {
        copyResult.businessModel.okrs[pIdx].objective = updatedText;
      } else {
        const cIdx = editingItem.childIndex ?? 0;
        copyResult.businessModel.okrs[pIdx].key_results[cIdx] = updatedText;
      }
    } else if (editingItem.itemType === "competitor") {
      const pIdx = editingItem.parentIndex ?? 0;
      const field = editingItem.targetField;
      if (copyResult.businessModel?.competitors?.[pIdx]) {
        copyResult.businessModel.competitors[pIdx][field] = updatedText;
      }
    } else if (editingItem.itemType === "milestone") {
      const pIdx = editingItem.parentIndex ?? 0;
      const field = editingItem.targetField;
      if (copyResult.businessModel?.milestones?.[pIdx]) {
        copyResult.businessModel.milestones[pIdx][field] = updatedText;
      }
    } else if (editingItem.itemType === "sop_field") {
      if (copyResult.sop) {
        copyResult.sop[editingItem.targetField] = updatedText;
      }
    } else if (editingItem.itemType === "sop_step") {
      const pIdx = editingItem.parentIndex ?? 0;
      if (copyResult.sop?.steps?.[pIdx]) {
        copyResult.sop.steps[pIdx].step_description = updatedText;
      }
    } else if (editingItem.itemType === "task") {
      const pIdx = editingItem.parentIndex ?? 0;
      if (copyResult.tasks?.[pIdx]) {
        copyResult.tasks[pIdx].description = updatedText;
      }
    } else if (editingItem.itemType === "risk") {
      const pIdx = editingItem.parentIndex ?? 0;
      if (copyResult.risks?.[pIdx]) {
        copyResult.risks[pIdx].description = updatedText;
      }
    } else if (editingItem.itemType === "marketing_campaign") {
      if (copyResult.marketing) {
        copyResult.marketing.goal = updatedText;
      }
    } else if (editingItem.itemType === "marketing_content") {
      const pIdx = editingItem.parentIndex ?? 0;
      if (copyResult.marketing?.posts?.[pIdx]) {
        copyResult.marketing.posts[pIdx].post_content = updatedText;
      }
    } else if (editingItem.itemType === "kb_article") {
      const pIdx = editingItem.parentIndex ?? 0;
      if (copyResult.kb?.[pIdx]) {
        copyResult.kb[pIdx].content = updatedText;
      }
    }

    setResultData(copyResult);
    await saveCurrentSessionEdits(copyResult);
    setEditingItem(null);
  };

  const handleApplyInlineEdit = async () => {
    if (!editingItem || !promptInstruction.trim()) return;
    setIsUpdatingField(true);

    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/ai-business/update-item", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
          "x-user-id": localStorage.getItem("userId") || "1"
        },
        body: JSON.stringify({
          itemType: editingItem.itemType,
          itemId: editingItem.itemId,
          currentText: editingItem.currentText,
          promptInstruction
        })
      });

      if (res.ok) {
        const data = await res.json();
        const updatedText = data.updatedText;

        // Mutate resultData state locally so the changes are immediately visible
        const copyResult = { ...resultData };

        if (editingItem.itemType === "swot") {
          const field = editingItem.targetField; // e.g. strengths
          const idx = editingItem.parentIndex ?? 0;
          if (copyResult.businessModel?.swot?.[field]) {
            copyResult.businessModel.swot[field][idx] = updatedText;
          }
        } else if (editingItem.itemType === "okr") {
          const pIdx = editingItem.parentIndex ?? 0;
          if (editingItem.targetField === "objective") {
            copyResult.businessModel.okrs[pIdx].objective = updatedText;
          } else {
            const cIdx = editingItem.childIndex ?? 0;
            copyResult.businessModel.okrs[pIdx].key_results[cIdx] = updatedText;
          }
        } else if (editingItem.itemType === "competitor") {
          const pIdx = editingItem.parentIndex ?? 0;
          const field = editingItem.targetField;
          if (copyResult.businessModel?.competitors?.[pIdx]) {
            copyResult.businessModel.competitors[pIdx][field] = updatedText;
          }
        } else if (editingItem.itemType === "milestone") {
          const pIdx = editingItem.parentIndex ?? 0;
          const field = editingItem.targetField;
          if (copyResult.businessModel?.milestones?.[pIdx]) {
            copyResult.businessModel.milestones[pIdx][field] = updatedText;
          }
        } else if (editingItem.itemType === "sop_field") {
          if (copyResult.sop) {
            copyResult.sop[editingItem.targetField] = updatedText;
          }
        } else if (editingItem.itemType === "sop_step") {
          const pIdx = editingItem.parentIndex ?? 0;
          if (copyResult.sop?.steps?.[pIdx]) {
            copyResult.sop.steps[pIdx].step_description = updatedText;
          }
        } else if (editingItem.itemType === "task") {
          const pIdx = editingItem.parentIndex ?? 0;
          if (copyResult.tasks?.[pIdx]) {
            copyResult.tasks[pIdx].description = updatedText;
          }
        } else if (editingItem.itemType === "risk") {
          const pIdx = editingItem.parentIndex ?? 0;
          if (copyResult.risks?.[pIdx]) {
            copyResult.risks[pIdx].description = updatedText;
          }
        } else if (editingItem.itemType === "marketing_campaign") {
          if (copyResult.marketing) {
            copyResult.marketing.goal = updatedText;
          }
        } else if (editingItem.itemType === "marketing_content") {
          const pIdx = editingItem.parentIndex ?? 0;
          if (copyResult.marketing?.posts?.[pIdx]) {
            copyResult.marketing.posts[pIdx].post_content = updatedText;
          }
        } else if (editingItem.itemType === "kb_article") {
          const pIdx = editingItem.parentIndex ?? 0;
          if (copyResult.kb?.[pIdx]) {
            copyResult.kb[pIdx].content = updatedText;
          }
        }

        setResultData(copyResult);
        await saveCurrentSessionEdits(copyResult);
        setEditingItem(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsUpdatingField(false);
    }
  };

  const handleSeedDataToDb = async () => {
    if (!resultData) return;
    setSeedStatus("loading");
    try {
      const token = localStorage.getItem("token");
      const res = await fetch("/api/ai-business/seed-data", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: token ? `Bearer ${token}` : "",
          "x-user-id": localStorage.getItem("userId") || "1"
        },
        body: JSON.stringify({ data: resultData })
      });

      if (res.ok) {
        setSeedStatus("success");
      } else {
        setSeedStatus("error");
      }
    } catch (err) {
      console.error("Error seeding customized business plan to DB:", err);
      setSeedStatus("error");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl font-sans" dir="rtl">
      {/* Upper Module Heading Accent */}
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between border-b pb-6 border-slate-100">
        <div>
          <div className="flex items-center gap-2 text-violet-600 font-extrabold mb-1">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="text-sm tracking-widest uppercase">الذكاء الاصطناعي الذاتي والأتمتة</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">مساعد الأعمال الخارق (AI Business)</h1>
          <p className="text-slate-500 mt-2 text-sm max-w-2xl">
            انقل أعمالك من مجرد نظام تشغيل تقليدي إلى بيئة أعمال تفاعلية ذاتية التأسيس والنمو بفضل التوجيه الذكاء الاصطناعي المتطور.
          </p>
        </div>

        {step > 1 && (
          <button
            onClick={() => {
              setStep(1);
              setResultData(null);
              setAnswers([]);
              setScopeDocument("");
              setAgentAnalysis("");
              setShowScopePreview(false);
            }}
            className="mt-4 md:mt-0 px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 transition"
          >
            البدء من جديد بفكرة جديدة
          </button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {/* STEP 1: Seed Business Input */}
        {step === 1 && (
          <motion.div
            key="step1"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            <div className="lg:col-span-8 space-y-6">
              <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm">
                <label className="block text-lg font-bold text-slate-800 mb-3">
                  اكتب فكرة مشروعك بحرية تامة:
                </label>
                <p className="text-xs text-slate-400 mb-4 font-normal">
                  لا داعي لصياغة نماذج معقدة، المساعد الذكي سيتولى مرافقتك لتوليد خريطة تشغيل متكاملة وتوزيعها على كافة المجموعات.
                </p>

                <textarea
                  value={seedInput}
                  onChange={(e) => setSeedInput(e.target.value)}
                  placeholder="أريد تأسيس شركة تقدّم خدمات سياحية وتجربة سفر علاجية متميزة، أو متجر إلكتروني لبيع أدوات الطبخ الطبيعية..."
                  className="w-full min-h-[160px] p-4 text-slate-800 outline-none border border-slate-200 rounded-2xl text-sm focus:border-violet-500 focus:ring-1 focus:ring-violet-500 placeholder-slate-400 leading-relaxed transition"
                />

                <div className="mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                  <button
                    onClick={handleLaunchDemo}
                    className="w-full sm:w-auto px-6 py-4 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/60 font-extrabold rounded-2xl tracking-wide flex items-center justify-center gap-2 transition"
                  >
                    <Sparkles className="w-4 h-4 text-amber-600 animate-pulse" />
                    تشغيل فوري ومحاكاة مجلس الإدارة (Demo 🚀)
                  </button>

                  <button
                    onClick={handleStartRefinement}
                    disabled={!seedInput.trim() || chatLoading}
                    className="w-full sm:w-auto px-8 py-4 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-2xl tracking-wide flex items-center justify-center gap-3 transition shadow-md shadow-violet-100 disabled:opacity-50"
                  >
                    {chatLoading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        جاري تهيئة المستشار...
                      </>
                    ) : (
                      <>
                        استكشاف وتطوير فكرتك الذكية
                        <ArrowRight className="w-5 h-5 rotate-180" />
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Inspiration list */}
              <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">نماذج ملهمة للبدء فوراً:</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {seedTemplates.map((tpl, i) => (
                    <button
                      key={i}
                      onClick={() => setSeedInput(tpl.text)}
                      className="text-right p-4 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl transition text-xs leading-relaxed space-y-2"
                    >
                      <span className="font-bold text-violet-600 block">{tpl.label}</span>
                      <span className="text-slate-500 font-normal line-clamp-3">{tpl.text}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Previous Sessions History & Info Sidebar */}
            <div className="lg:col-span-4 space-y-6">
              {/* History Panel */}
              <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-violet-600" />
                    سجل جلسات التخطيط السابقة
                  </h3>
                  <button
                    onClick={handleStartNewSession}
                    title="بدء جلسة تخطيط جديدة"
                    className="p-1 px-2.5 bg-violet-50 hover:bg-violet-100 text-violet-700 font-bold text-[11px] rounded-lg flex items-center gap-1 transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    جديد
                  </button>
                </div>

                <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1">
                  {sessions.length === 0 ? (
                    <div className="text-center py-8 text-slate-400 text-xs">
                      لا يوجد جلسات تخطيط سابقة حالياً.
                    </div>
                  ) : (
                    sessions.map((sess) => {
                      const isLoaded = currentSessionId === sess.id;
                      const hasCompleted = sess.is_satisfied;
                      const dateObj = new Date(sess.created_at);
                      const formattedDate = isNaN(dateObj.getTime()) 
                        ? "" 
                        : dateObj.toLocaleDateString("ar-EG", { month: "short", day: "numeric" });

                      return (
                        <div
                          key={sess.id}
                          onClick={() => handleLoadSession(sess)}
                          className={`group text-right p-3 rounded-2xl border transition cursor-pointer relative flex flex-col justify-between gap-2 overflow-hidden ${
                            isLoaded
                              ? "bg-violet-50/50 border-violet-200/80 shadow-sm shadow-violet-100/50"
                              : "bg-slate-50 hover:bg-slate-100/70 border-slate-100"
                          }`}
                        >
                          {/* Inner glowing highlight for loaded session */}
                          {isLoaded && (
                            <div className="absolute right-0 top-0 bottom-0 w-1 bg-violet-600 rounded-r-full" />
                          )}

                          <div className="flex justify-between items-start gap-2">
                            <span className="text-xs font-extrabold text-slate-800 line-clamp-2 leading-relaxed flex-1">
                              {sess.seed_input || "جلسة غير مسماة"}
                            </span>
                            <button
                              onClick={(e) => handleDeleteSession(sess.id, e)}
                              className="text-slate-400 hover:text-red-600 p-1 rounded-lg hover:bg-slate-200/50 transition opacity-0 group-hover:opacity-100 self-start shrink-0"
                              title="حذف الجلسة"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center justify-between mt-1 text-[10px]">
                            <span className="text-slate-400 font-sans">{formattedDate}</span>
                            <span className={`px-2 py-0.5 rounded-full font-bold text-[9px] ${
                              hasCompleted
                                ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                                : "bg-amber-50 text-amber-700 border border-amber-100"
                            }`}>
                              {hasCompleted ? "مكتمل" : "مسودة تشغيلية"}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Informational Guidance Panel */}
              <div className="bg-gradient-to-br from-violet-900 to-indigo-950 text-white p-6 rounded-3xl shadow-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-32 h-32 bg-violet-500/10 rounded-full filter blur-xl" />
                <h3 className="text-sm font-black tracking-widest text-violet-300 uppercase mb-4">آلية تشغيل المستشار الذكي</h3>
                <ol className="space-y-4 text-xs font-normal leading-relaxed text-indigo-100">
                  <li className="flex gap-3">
                    <span className="flex items-center justify-center w-5 h-5 bg-violet-800 rounded-md text-violet-300 font-bold shrink-0">١</span>
                    <span>تستقبل الفكرة الأولية وتبدأ بصياغتها ذهنياً.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex items-center justify-center w-5 h-5 bg-violet-800 rounded-md text-violet-300 font-bold shrink-0">٢</span>
                    <span>تطرح المحادثة الاستكشافية من ٣ إلى ٥ أسئلة دقيقة لسد الثغرات وتحديد حجم المستهدفين.</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex items-center justify-center w-5 h-5 bg-violet-800 rounded-md text-violet-300 font-bold shrink-0">٣</span>
                    <span>يتم التوليد الشامل والضخ الفوري للبيانات في كافة موديولات النظام (SOPs, RACI, Tasks, Risks, Marketing, Training).</span>
                  </li>
                </ol>
              </div>
            </div>
          </motion.div>
        )}

        {/* STEP 2: Refine / Scope Preview */}
        {step === 2 && (
          <motion.div
            key="step2"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="max-w-5xl mx-auto space-y-6"
          >
            {!showScopePreview ? (
              <div className="bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6 max-w-3xl mx-auto">
                <div className="flex items-center justify-between border-b pb-4">
                  <h2 className="text-md font-extrabold text-slate-800 flex items-center gap-2">
                    <span className="p-1.5 bg-violet-50 text-violet-600 rounded-lg">
                      <HelpCircle className="w-4 h-4" />
                    </span>
                    المحادثة الاستكشافية وسد الفجوات التشغيلية
                  </h2>
                  <span className="text-xs bg-slate-100 text-slate-500 px-3 py-1 rounded-full font-bold">
                    سؤال {answers.length + 1} من 4
                  </span>
                </div>

                {/* Chat Thread history */}
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                  <div className="bg-slate-50 p-4 rounded-2xl text-xs leading-relaxed text-slate-600 border border-slate-100">
                    <span className="font-extrabold text-slate-500 block mb-1">فكرة مشروعك الأولية:</span>
                    {seedInput}
                  </div>

                  {answers.map((ans, i) => (
                    <div key={i} className="space-y-3">
                      <div className="bg-violet-50 p-4 rounded-2xl text-xs border border-violet-100/50 leading-relaxed text-slate-700 mr-8">
                        <span className="font-extrabold text-violet-600 block mb-1">المستشار الذكي (المحاور الاستراتيجي):</span>
                        {ans.question}
                      </div>
                      <div className="bg-white p-4 rounded-2xl text-xs border border-slate-100 leading-relaxed text-slate-800 ml-8 shadow-sm">
                        <span className="font-extrabold text-slate-500 block mb-1">إجابتك:</span>
                        {ans.answer}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Current Question Zone */}
                <div className="bg-violet-50/50 p-6 rounded-2xl border border-violet-100/20 space-y-4">
                  <h3 className="text-sm font-black text-violet-950 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-violet-600 shrink-0" />
                    {currentQuestion}
                  </h3>

                  <input
                    type="text"
                    value={currentAnswer}
                    onChange={(e) => setCurrentAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleAnswerSubmit();
                    }}
                    disabled={chatLoading}
                    placeholder="اكتب إجابتك هنا بدقة ووضوح..."
                    className="w-full p-4 text-slate-800 bg-white border border-slate-200 rounded-xl text-xs focus:ring-1 focus:ring-violet-500 focus:border-violet-500 outline-none leading-relaxed transition"
                  />

                  <div className="flex justify-between items-center pt-2">
                    <button
                      onClick={handleBypassToScope}
                      disabled={chatLoading}
                      className="text-xs text-slate-500 underline hover:text-slate-800 font-bold transition disabled:opacity-40"
                    >
                      تجاوز الأسئلة وصياغة النطاق الآن
                    </button>

                    <button
                      onClick={handleAnswerSubmit}
                      disabled={!currentAnswer.trim() || chatLoading}
                      className="px-6 py-2.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition"
                    >
                      {chatLoading ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <>
                          إرسال الإجابة
                          <Send className="w-3 h-3 rotate-180" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Strategic Scope Review & Virtual Board Members */
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Right: The Generative Scope Document */}
                <div className="lg:col-span-7 bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm space-y-6">
                  <div className="flex items-center gap-2 border-b pb-4">
                    <span className="p-1.5 bg-violet-50 text-violet-700 rounded-xl font-normal">
                      <FileText className="w-5 h-5" />
                    </span>
                    <div>
                      <h2 className="text-lg font-black text-slate-900">وثيقة نطاق العمل الرقمية المقرة</h2>
                      <p className="text-xs text-slate-500 mt-0.5">تم صياغتها واعتمادها بواسطة العميل: المحاور الاستراتيجي</p>
                    </div>
                  </div>

                  <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-100/50 text-xs text-slate-700 leading-relaxed whitespace-pre-wrap font-sans max-h-[500px] overflow-y-auto pr-2">
                    {scopeDocument || "جاري تجميع متطلبات وثيقة نطاق العمل..."}
                  </div>
                </div>

                {/* Left: AI Board room composition */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Strategic evaluation badge */}
                  {agentAnalysis && (
                    <div className="bg-violet-950 text-white p-6 rounded-3xl shadow-sm relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/10 rounded-full filter blur-lg" />
                      <h3 className="text-xs font-black text-violet-300 uppercase tracking-widest mb-2">تقييم العميل الاستراتيجي للفرصة</h3>
                      <p className="text-xs text-indigo-100 leading-relaxed font-normal">{agentAnalysis}</p>
                    </div>
                  )}

                  {/* Virtual Board Composition */}
                  <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-4">
                    <h3 className="text-sm font-black text-slate-800">مجلس الإدارة الافتراضي المستعد للتأسيس:</h3>
                    <p className="text-xs text-slate-400">سينقسم مجلس الإدارة إلى 5 عملاء مستقلين، يمتلك كل منهم تخصصًا دقيقًا وصلاحيات بالتعديل والتدقيق المتوازن:</p>
                    
                    <div className="space-y-3 pt-2">
                      {[
                        { icon: "🕵️‍♂️", title: "المايسترو والموجه (Orchestrator Agent - CEO)", desc: "يأخذ وثيقة النطاق، يفكك المهام، ويوجه العملاء التنفيذيين بالتوازي." },
                        { icon: "⚙️", title: "أخصائي هندسة العمليات (Process Agent)", desc: "يتولى كتابة إجراءات التشغيل القياسية SOPs وخريطة تدفق العمل والربط الإداري." },
                        { icon: "📋", title: "أخصائي تنظيم المشاريع (PM Agent)", desc: "يناقش المهام الإنشائية والتشغيلية، وجدولتها، وتكليف الـ RACI المناسب للموظفين." },
                        { icon: "🛡️", title: "أخصائي مخاطر وضمان جودة (Risk & QA Agent)", desc: "يكشف الثغرات استباقياً، يكتب سجل المخاطر وطريقة معالجتها ومعايير الـ Quality QA." },
                        { icon: "📈", title: "أخصائي نمو وتطوير تجاري (Growth Agent)", desc: "يدرس القنوات الرقمية ومراحل المبيعات AIDA، ويجهز داتا المنتجات والعملاء لـ CRM." }
                      ].map((agent, i) => (
                        <div key={i} className="flex gap-3 bg-slate-50/50 p-3 rounded-xl border border-slate-100/50 hover:bg-slate-50 transition">
                          <span className="text-xl shrink-0">{agent.icon}</span>
                          <div>
                            <h4 className="text-xs font-bold text-slate-800">{agent.title}</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{agent.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="pt-4">
                      <button
                        onClick={() => handleBigBangGeneration(answers)}
                        className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 transition shadow-md shadow-violet-100"
                      >
                        <Sparkles className="w-4 h-4 animate-spin-slow" />
                        توجيه ومحاكاة مجلس الإدارة والضخ الشامل للأنظمة
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* STEP 3: Generation Loader OR Final Results Dashboard */}
        {step === 3 && (
          <motion.div
            key="step3"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            {generationLoading ? (
              <div className="max-w-2xl mx-auto py-12 space-y-8 bg-white border border-slate-100 rounded-3xl p-6 md:p-8 shadow-sm">
                <div className="text-center space-y-4">
                  <div className="relative inline-block">
                    <div className="w-16 h-16 rounded-full border-4 border-violet-100 border-t-violet-600 animate-spin flex items-center justify-center mx-auto" />
                    <Sparkles className="w-6 h-6 text-violet-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                  </div>
                  <h2 className="text-lg font-black text-slate-800">جاري انعقاد مجلس الإدارة الافتراضي وتأسيس الشركة التشغيلي...</h2>
                  <p className="text-xs text-slate-500 max-w-lg mx-auto">
                    ينقسم العمل الآن توازياً وتناغمياً بين خمسة عملاء مستقلين يمتلكون تخصصات صارمة وصلاحية التدقيق المتبادل ومزامنة قواعد البيانات.
                  </p>
                </div>

                {/* Simulated board status timeline */}
                <div className="space-y-3 border-t pt-6 border-slate-50">
                  {[
                    { icon: "🕵️‍♂️", name: "المايسترو والموجه (Orchestrator Agent - CEO)", role: "تفكيك وثيقة نطاق العمل الرقمية وصياغة التكاليف الاستراتيجية" },
                    { icon: "⚙️", name: "أخصائي هندسة العمليات (Process Agent)", role: "توليد كتل الخطوات القياسية المتقاطعة وصياغة الـ SOPs التفصيلية" },
                    { icon: "📋", name: "أخصائي تنظيم المشاريع (PM Agent)", role: "تسكين مصفوفة الصلاحيات RACI وتوزيع المهام على الـ Kanban Board" },
                    { icon: "🛡️", name: "أخصائي معالجة المخاطر ومراقبة الجودة (Risk & QA Agent)", role: "تدقيق معايير إدارة الجودة استباقياً وصياغة سجل المخاطر ومعالجة الانحرافات CAPA" },
                    { icon: "📈", name: "أخصائي تطوير المبيعات والنمو التجاري (Growth Agent)", role: "توليد الخطة التسويقية وتأسيس داتا المنتجات والعملاء لموديول الـ CRM" }
                  ].map((agent, index) => {
                    let statusLabel = "";
                    let statusBadgeSecs = "";
                    let isProcessing = false;

                    if (index < loadingAgentIndex) {
                      statusLabel = "اكتمل بنجاح وقام بضخ البيانات";
                      statusBadgeSecs = "bg-emerald-50 text-emerald-750 border-emerald-100/50";
                    } else if (index === loadingAgentIndex) {
                      statusLabel = "جاري العمل والمعالجة والتدقيق الذكي...";
                      statusBadgeSecs = "bg-violet-50 text-violet-750 border-violet-100/50 animate-pulse";
                      isProcessing = true;
                    } else {
                      statusLabel = "بانتظار قرار المايسترو ومخرجات الزملاء للبدء...";
                      statusBadgeSecs = "bg-slate-50 text-slate-400 border-slate-150/10";
                    }

                    return (
                      <div key={index} className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50/50 hover:bg-slate-50 transition border border-slate-100/30 rounded-2xl gap-3">
                        <div className="flex items-start gap-3">
                          <span className="text-2xl shrink-0">{agent.icon}</span>
                          <div>
                            <h4 className="text-xs font-extrabold text-slate-800">{agent.name}</h4>
                            <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">{agent.role}</p>
                          </div>
                        </div>

                        <div className={`text-[10px] font-bold px-3 py-1.5 rounded-full border self-start md:self-center shrink-0 flex items-center gap-1.5 ${statusBadgeSecs}`}>
                          {isProcessing && <Loader2 className="w-3 h-3 animate-spin shrink-0" />}
                          {statusLabel}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="bg-violet-50 rounded-2xl p-4 border border-violet-100/20 text-center text-xs font-bold text-violet-800 animate-pulse">
                  {loadingPhrase}
                </div>

                {/* Live Event Streaming Feed (التدفق التدريجي الحي) */}
                <div className="space-y-3 border-t pt-6 border-slate-100">
                  <h3 className="text-xs font-black text-slate-700 tracking-wider flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-505 animate-pulse inline-block shrink-0 bg-emerald-500" />
                    <span>النشر والتركيب التدريجي المباشر لعقد السيستم (Live Event Streaming)</span>
                  </h3>
                  <p className="text-[10px] text-slate-500">
                    رصد حي لإجراءات صب الجداول وضخ القيود طوبة بطوبة في قاعدة البيانات عبر قنوات الـ WebSockets:
                  </p>

                  <div className="bg-slate-900 rounded-2xl p-4 font-mono text-[11px] text-emerald-400 border border-slate-800 space-y-2 max-h-60 overflow-y-auto shadow-inner text-left" dir="ltr">
                    {liveStreamAlerts.length === 0 ? (
                      <div className="text-slate-500 animate-pulse text-center py-4 flex items-center justify-center gap-2 font-sans text-xs">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-500" />
                        <span>بانتظار قنوات البث الحية لمجلس الإدارة...</span>
                      </div>
                    ) : (
                      liveStreamAlerts.map((log) => (
                        <div key={log.id} className="flex gap-2 items-start py-1 border-b border-slate-800/50 last:border-0 hover:bg-slate-800/30 px-1 rounded transition">
                          <span className="text-slate-500 shrink-0 select-none">
                            [{log.timestamp.toLocaleTimeString('en-US', { hour12: false })}]
                          </span>
                          <span className="flex-1 text-slate-200 font-sans leading-relaxed text-right" dir="rtl">
                            {log.message}
                          </span>
                        </div>
                      ))
                    )}
                    <div ref={liveProgressEndRef} />
                  </div>
                </div>
              </div>
            ) : resultData ? (
              <div className="space-y-8 font-sans">
                {/* Database Seeding & Integration Master Control Center Panel */}
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
                  <div className="flex gap-4 items-start">
                    <div className="p-3 bg-indigo-50 text-indigo-700 rounded-2xl shrink-0">
                      <Database className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-sm font-black text-slate-950 font-sans">تأصيل وترحيل قاعدة بيانات الأعمال (Database Seeding Control)</h3>
                      <p className="text-xs text-slate-500 mt-1 leading-relaxed max-w-xl font-sans">
                        يمكنك الاطلاع ومراجعة مخرجات مجلس الإدارة الافتراضي من تبويبات التصفح بالأسفل وتعديل أي فِقرة يدوياً أو بمساعدة الذكاء الاصطناعي. عند الانتهاء والاعتماد، اضغط على <strong>"مزامنة وترحيل الخطة لقواعد البيانات"</strong> لتأصيل الأعمال وربطها فوراً بجميع موديولات السيستم.
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 font-sans">
                    {seedStatus === "success" ? (
                      <div className="px-5 py-3.5 bg-emerald-50 text-emerald-800 border-emerald-100 border text-xs font-extrabold rounded-2xl flex items-center gap-2 shadow-sm">
                        <CheckCircle className="w-4 h-4 text-emerald-600 animate-bounce" />
                        <span>تم غرس وترحيل البيانات لقواعد البيانات بنجاح! ✓</span>
                      </div>
                    ) : seedStatus === "error" ? (
                      <div className="flex flex-col gap-2 items-end">
                        <span className="text-xs text-red-600 font-bold font-sans">فشل ترحيل البيانات يرجى المحاولة لاحقاً.</span>
                        <button
                          onClick={handleSeedDataToDb}
                          className="px-5 py-3 bg-red-600 text-white text-xs font-bold rounded-xl font-sans"
                        >
                          إعادة المحاولة
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={handleSeedDataToDb}
                        disabled={seedStatus === "loading"}
                        className="px-6 py-4 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white text-xs font-black rounded-2xl flex items-center justify-center gap-2 transition shadow-md shadow-violet-100 font-sans"
                      >
                        {seedStatus === "loading" ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            <span>جاري معالجة وصب الجداول...</span>
                          </>
                        ) : (
                          <>
                            <Database className="w-4 h-4" />
                            <span>مزامنة وترحيل الخطة لقواعد البيانات 🚀</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Main Tabs switcher */}
                <div className="flex border-b border-slate-100 pb-px gap-2 overflow-x-auto font-sans">
                  {[
                    { id: "structure", label: "الهيكلة والاستراتيجية", icon: LayoutGrid },
                    { id: "ops", label: "سير العمليات والـ SOPs", icon: BookOpen },
                    { id: "growth", label: "النمو والتسويق", icon: Megaphone },
                    { id: "knowledge", label: "المعرفة والتدريب", icon: GraduationCap },
                    { id: "board_room", label: "مداولات مجلس الإدارة الافتراضي", icon: Sparkles },
                    { id: "agent_simulation", label: "محاكاة العملاء والعمليات", icon: Terminal }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-5 py-3 border-b-2 font-bold text-xs whitespace-nowrap transition ${
                          activeTab === tab.id
                            ? "border-violet-600 text-violet-600 bg-violet-50/20"
                            : "border-transparent text-slate-500 hover:text-slate-800"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {tab.label}
                      </button>
                    );
                  })}
                </div>

                {/* Sub Tab contents view */}
                <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm">
                  {/* Category A: Structure & Strategy */}
                  {activeTab === "structure" && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* SWOT Analysis */}
                        <div className="border border-slate-100 rounded-2xl p-5">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                            <Target className="w-4 h-4 text-violet-500" /> تحليل SWOT الاستراتيجي
                          </h4>
                          <div className="grid grid-cols-2 gap-3 text-xs">
                            <div className="bg-emerald-50/30 p-3 rounded-xl">
                              <span className="font-extrabold text-emerald-700 block mb-1">نقاط القوة</span>
                              <div className="space-y-2 text-slate-600">
                                {resultData.businessModel?.swot?.strengths?.map((s: string, idx: number) => (
                                  <div key={idx} className="bg-white/80 p-2 rounded-lg border border-emerald-100/40 flex flex-col gap-1.5 justify-between">
                                    <span>• {s}</span>
                                    <button
                                      onClick={() => triggerInlineEdit("swot", "local", s, "strengths", idx)}
                                      className="flex items-center gap-1 px-2 py-0.5 bg-violet-50 hover:bg-violet-100 text-violet-700 font-extrabold text-[10px] rounded border border-violet-150 transition self-start"
                                    >
                                      <Wand2 className="w-2.5 h-2.5" />
                                      <span>تعديل ذكي</span>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="bg-red-50/30 p-3 rounded-xl">
                              <span className="font-extrabold text-red-700 block mb-1">نقاط الضعف</span>
                              <div className="space-y-2 text-slate-600">
                                {resultData.businessModel?.swot?.weaknesses?.map((w: string, idx: number) => (
                                  <div key={idx} className="bg-white/80 p-2 rounded-lg border border-red-100/40 flex flex-col gap-1.5 justify-between">
                                    <span>• {w}</span>
                                    <button
                                      onClick={() => triggerInlineEdit("swot", "local", w, "weaknesses", idx)}
                                      className="flex items-center gap-1 px-2 py-0.5 bg-violet-50 hover:bg-violet-100 text-violet-700 font-extrabold text-[10px] rounded border border-violet-150 transition self-start"
                                    >
                                      <Wand2 className="w-2.5 h-2.5" />
                                      <span>تعديل ذكي</span>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="bg-blue-50/30 p-3 rounded-xl">
                              <span className="font-extrabold text-blue-700 block mb-1">الفرص المتاحة</span>
                              <div className="space-y-2 text-slate-600">
                                {resultData.businessModel?.swot?.opportunities?.map((o: string, idx: number) => (
                                  <div key={idx} className="bg-white/80 p-2 rounded-lg border border-blue-100/40 flex flex-col gap-1.5 justify-between">
                                    <span>• {o}</span>
                                    <button
                                      onClick={() => triggerInlineEdit("swot", "local", o, "opportunities", idx)}
                                      className="flex items-center gap-1 px-2 py-0.5 bg-violet-50 hover:bg-violet-100 text-violet-700 font-extrabold text-[10px] rounded border border-violet-150 transition self-start"
                                    >
                                      <Wand2 className="w-2.5 h-2.5" />
                                      <span>تعديل ذكي</span>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="bg-orange-50/30 p-3 rounded-xl">
                              <span className="font-extrabold text-orange-700 block mb-1">التهديدات المتوقعة</span>
                              <div className="space-y-2 text-slate-600">
                                {resultData.businessModel?.swot?.threats?.map((t: string, idx: number) => (
                                  <div key={idx} className="bg-white/80 p-2 rounded-lg border border-orange-100/40 flex flex-col gap-1.5 justify-between">
                                    <span>• {t}</span>
                                    <button
                                      onClick={() => triggerInlineEdit("swot", "local", t, "threats", idx)}
                                      className="flex items-center gap-1 px-2 py-0.5 bg-violet-50 hover:bg-violet-100 text-violet-700 font-extrabold text-[10px] rounded border border-violet-150 transition self-start"
                                    >
                                      <Wand2 className="w-2.5 h-2.5" />
                                      <span>تعديل ذكي</span>
                                    </button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Objectives & Key Results (OKRs) */}
                        <div className="border border-slate-100 rounded-2xl p-5 space-y-4">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                            <CheckCircle className="w-4 h-4 text-violet-500" /> الأهداف والنتائج الرئيسية (OKRs)
                          </h4>
                          <div className="space-y-4 text-xs">
                            {resultData.businessModel?.okrs?.map((okr: any, idx: number) => (
                              <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-3 relative flex flex-col justify-between">
                                <div>
                                  <span className="font-extrabold text-slate-800 block mb-1">الهدف: {okr.objective}</span>
                                  <button
                                    onClick={() => triggerInlineEdit("okr", "local", okr.objective, "objective", idx)}
                                    className="flex items-center gap-1 px-2.5 py-1 bg-violet-50 hover:bg-violet-100 text-violet-700 font-extrabold text-[10px] rounded border border-violet-150 transition self-start mb-2"
                                  >
                                    <Wand2 className="w-2.5 h-2.5" />
                                    <span>تعديل الهدف</span>
                                  </button>
                                </div>
                                <div className="border-t pt-2 border-slate-200/50">
                                  <strong className="block mb-1 text-slate-700 text-[10px]">النتائج الرئيسية (Key Results):</strong>
                                  <div className="space-y-2">
                                    {okr.key_results?.map((kr: string, krIdx: number) => (
                                      <div key={krIdx} className="bg-white/80 p-2 rounded border border-slate-100 flex flex-col gap-1.5 justify-between">
                                        <span className="text-slate-600 font-normal">• {kr}</span>
                                        <button
                                          onClick={() => triggerInlineEdit("okr", "local", kr, "key_result", idx, krIdx)}
                                          className="flex items-center gap-1 px-2.5 py-1 bg-violet-50 hover:bg-violet-100 text-violet-700 font-extrabold text-[10px] rounded border border-violet-150 transition self-start"
                                        >
                                          <Wand2 className="w-2.5 h-2.5" />
                                          <span>تعديل النتيجة</span>
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Competitors & Competitive Advantages */}
                      <div className="border border-slate-100 rounded-2xl p-5">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">المنافسون ونقاط التميز التنافسي</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {resultData.businessModel?.competitors?.map((comp: any, idx: number) => (
                            <div key={idx} className="bg-white border border-slate-100 rounded-xl p-4 text-xs space-y-3 flex flex-col justify-between hover:border-violet-200 transition">
                              <div className="space-y-2">
                                <span className="font-extrabold text-slate-800 text-sm block">{comp.name}</span>
                                <p className="text-slate-500 leading-relaxed">
                                  <strong className="text-slate-800">نقاط القوة لديهم:</strong> {comp.strengths}
                                </p>
                                <p className="text-slate-500 leading-relaxed">
                                  <strong className="text-slate-800">نقاط الضعف لديهم:</strong> {comp.weaknesses}
                                </p>
                                <div className="bg-violet-50/50 p-2 rounded text-violet-800 border border-violet-100/30">
                                  <strong>تميزنا التنافسي:</strong> {comp.edge}
                                </div>
                              </div>
                              <button
                                onClick={() => triggerInlineEdit("competitor", "local", comp.edge, "edge", idx)}
                                className="flex items-center gap-1 px-2.5 py-1 bg-violet-50 hover:bg-violet-100 text-violet-700 font-extrabold text-[10px] rounded border border-violet-150 transition self-stretch justify-center"
                              >
                                <Wand2 className="w-2.5 h-2.5" />
                                <span>تعديل الميزة التنافسية الذكي</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}


                  {/* Category B: Operations & SOPs */}
                  {activeTab === "ops" && (
                    <div className="space-y-6">
                      {/* SOP Details */}
                      {resultData.sop && (
                        <div className="border border-slate-100 rounded-2xl p-5 space-y-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-xs bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full font-bold">دليل إجراءات التشغيل (SOP)</span>
                              <h3 className="text-lg font-extrabold text-slate-800 mt-2">{resultData.sop.title}</h3>
                            </div>
                            <button
                              onClick={() => triggerInlineEdit("sop_field", "local", resultData.sop.objective, "objective")}
                              className="text-violet-600 hover:text-violet-800 font-bold text-xs flex items-center gap-1 transition"
                            >
                              <Wand2 className="w-3.5 h-3.5" /> تعديل الأهداف بواسطة الذكاء الاصطناعي
                            </button>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                            <div className="bg-slate-50 p-3 h-full rounded-xl">
                              <strong className="text-slate-800 block mb-1">الهدف الرئيسي (Objective)</strong>
                              <p className="text-slate-500 leading-relaxed">{resultData.sop.objective}</p>
                            </div>
                            <div className="bg-slate-50 p-3 h-full rounded-xl">
                              <strong className="text-slate-800 block mb-1">نطاق العمل ومؤشرات الأداء (KPIs)</strong>
                              <p className="text-slate-500 leading-relaxed">{resultData.sop.kpis}</p>
                            </div>
                          </div>

                          {/* Process Step list */}
                          <div className="space-y-3 pt-4">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 border-b pb-2">خطوات العمل المتتابعة (مع مصفوفة RACI المدمجة)</h4>
                            {resultData.sop.steps?.map((step: any, idx: number) => {
                              const raciItem = resultData.raci?.find((r: any) => r.step_number === step.step_number);
                              return (
                                <div key={idx} className="flex gap-4 items-start bg-white border border-slate-100 p-4 rounded-xl relative group hover:border-violet-200 transition">
                                  <span className="flex items-center justify-center w-7 h-7 bg-violet-50 text-violet-600 font-extrabold text-xs rounded-lg shrink-0">
                                    {step.step_number}
                                  </span>
                                  <div className="text-xs leading-relaxed flex-1 space-y-1">
                                    <p className="text-slate-800 font-bold">{step.step_description}</p>
                                    <p className="text-slate-500"><strong className="text-slate-600">النتيجة المتوقعة:</strong> {step.expected_result}</p>
                                    {raciItem && (
                                      <div className="inline-flex items-center gap-3 bg-indigo-50/50 text-indigo-950 px-2.5 py-1 rounded-md text-[10px] mt-1">
                                        <b dir="ltr" className="bg-indigo-600 text-white rounded w-4 h-4 flex items-center justify-center font-bold">{raciItem.role_type}</b>
                                        <span>الأدوار: {raciItem.role_name}</span>
                                      </div>
                                    )}
                                  </div>
                                  <button
                                    onClick={() => triggerInlineEdit("sop_step", "local", step.step_description, "step_description", idx)}
                                    className="opacity-0 group-hover:opacity-100 text-violet-600 hover:text-violet-800 transition"
                                  >
                                    <Wand2 className="w-4 h-4" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Category C: Growth & Marketing */}
                  {activeTab === "growth" && (
                    <div className="space-y-6">
                      {/* Tasks Action items */}
                      <div className="border border-slate-100 rounded-2xl p-5 space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">قائمة المهام التأسيسية الفورية (لإطلاق فوري)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {resultData.tasks?.map((t: any, idx: number) => (
                            <div key={idx} className="flex gap-4 p-4 border border-slate-100 rounded-xl relative group hover:border-violet-100 transition">
                              <span className="p-2 bg-slate-50 text-slate-500 rounded-lg shrink-0 h-9 w-9 flex items-center justify-center">
                                <List className="w-5 h-5" />
                              </span>
                              <div className="text-xs space-y-1 flex-1">
                                <div className="flex items-center justify-between">
                                  <span className="font-extrabold text-slate-800">{t.title}</span>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    t.priority === "high" ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"
                                  }`}>
                                    {t.priority}
                                  </span>
                                </div>
                                <p className="text-slate-500 font-normal leading-relaxed">{t.description}</p>
                              </div>
                              <button
                                onClick={() => triggerInlineEdit("task", "local", t.description, "description", idx)}
                                className="opacity-0 group-hover:opacity-100 text-violet-600 hover:text-violet-800 transition shrink-0"
                              >
                                <Wand2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Risks register */}
                      <div className="border border-slate-100 rounded-2xl p-5 space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">سجل المخاطر وتجنب التهديدات</h4>
                        <div className="space-y-3">
                          {resultData.risks?.map((r: any, idx: number) => (
                            <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-1 md:grid-cols-12 gap-4 items-center relative group">
                              <div className="md:col-span-3 text-xs">
                                <span className="font-extrabold text-slate-800 block text-sm">{r.name}</span>
                                <span className="text-[10px] text-slate-500 block">{r.category}</span>
                              </div>
                              <div className="md:col-span-5 text-xs text-slate-500 leading-relaxed">
                                <p>{r.description}</p>
                                <div className="mt-1 flex items-center gap-2">
                                  <strong className="text-slate-700">خيار التخفيف:</strong>
                                  <span>{r.mitigation_plan}</span>
                                </div>
                              </div>
                              <div className="md:col-span-3 flex gap-3 text-xs font-bold font-sans justify-end">
                                <span className={`px-2.5 py-1 rounded-md text-[10px] ${
                                  r.probability >= 4 ? "bg-red-100 text-red-800" : "bg-slate-200 text-slate-700"
                                }`}>احتمالية: {r.probability}</span>
                                <span className={`px-2.5 py-1 rounded-md text-[10px] ${
                                  r.impact >= 4 ? "bg-red-100 text-red-800" : "bg-slate-200 text-slate-700"
                                }`}>أثر: {r.impact}</span>
                              </div>
                              <button
                                onClick={() => triggerInlineEdit("risk", "local", r.description, "description", idx)}
                                className="absolute left-2 opacity-0 group-hover:opacity-100 text-violet-600 hover:text-violet-800 transition"
                              >
                                <Wand2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Marketing campaign */}
                      {resultData.marketing && (
                        <div className="border border-slate-100 rounded-2xl p-5 space-y-5">
                          <div className="flex justify-between items-start">
                            <div>
                              <span className="text-xs bg-pink-100 text-pink-700 px-2.5 py-1 rounded-full font-bold">خطة التسويق الرقمي</span>
                              <h3 className="text-md font-extrabold text-slate-800 mt-2">{resultData.marketing.campaign_title}</h3>
                            </div>
                            <button
                              onClick={() => triggerInlineEdit("marketing_campaign", "local", resultData.marketing.goal, "goal")}
                              className="text-violet-600 hover:text-violet-800 font-bold text-xs flex items-center gap-1 transition"
                            >
                              <Wand2 className="w-3.5 h-3.5" /> تعديل هدف الحملة
                            </button>
                          </div>

                          <div className="text-xs bg-pink-50/20 border border-pink-100 p-4 rounded-xl text-slate-600 leading-relaxed">
                            <strong>هدف الحملة الاستراتيجي:</strong> {resultData.marketing.goal} | المنصة المقترحة: {resultData.marketing.platform}
                          </div>

                          <div className="space-y-4 pt-2">
                            <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 border-b pb-2">منشورات تسويقية مصاغة بأطر AIDA لجذب المتابعين</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {resultData.marketing.posts?.map((post: any, idx: number) => (
                                <div key={idx} className="bg-white border rounded-xl p-4 text-xs relative group h-full flex flex-col justify-between">
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between border-b pb-2">
                                      <span className="font-extrabold text-slate-800">{post.title}</span>
                                      <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">{post.platform}</span>
                                    </div>
                                    <p className="text-slate-600 font-normal leading-relaxed whitespace-pre-wrap">{post.post_content}</p>
                                  </div>
                                  <div className="pt-4 flex justify-end">
                                    <button
                                      onClick={() => triggerInlineEdit("marketing_content", "local", post.post_content, "post_content", idx)}
                                      className="text-violet-600 hover:text-violet-800 text-xs font-bold inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition"
                                    >
                                      <Wand2 className="w-3.5 h-3.5" /> تعديل المنشور بالـ AI
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Category D: Knowledge & Training */}
                  {activeTab === "knowledge" && (
                    <div className="space-y-6">
                      {/* FAQs articles categories */}
                      <div className="border border-slate-100 rounded-2xl p-5 space-y-4">
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">مقالات والسياسات العامة لقاعدة المعرفة (KB)</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {resultData.kb?.map((art: any, idx: number) => (
                            <div key={idx} className="bg-slate-50/50 p-4 border border-slate-100 rounded-xl relative group space-y-2">
                              <span className="font-extrabold text-slate-800 text-xs block">{art.title}</span>
                              <p className="text-xs text-slate-500 font-normal leading-relaxed line-clamp-3">{art.content}</p>
                              <div className="pt-2 flex justify-end">
                                <button
                                  onClick={() => triggerInlineEdit("kb_article", "local", art.content, "content", idx)}
                                  className="text-violet-600 hover:text-violet-800 text-xs font-bold inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition"
                                >
                                  <Wand2 className="w-3.5 h-3.5" /> تعديل الصياغة بالكامل
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Course design and quiz assessments */}
                      {resultData.training && (
                        <div className="border border-slate-100 rounded-2xl p-5 space-y-5">
                          <span className="text-xs bg-violet-100 text-violet-700 px-2.5 py-1 rounded-full font-bold">مسار التدريب والتقييم للموظفين</span>
                          <div className="text-xs space-y-1">
                            <h3 className="text-sm font-extrabold text-slate-800">{resultData.training.course_title}</h3>
                            <p className="text-slate-500 font-normal">{resultData.training.description}</p>
                            <p className="text-slate-400 italic">الأهداف: {resultData.training.objectives}</p>
                          </div>

                          <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-4 text-xs">
                            <div className="border-b pb-2">
                              <span className="font-extrabold text-slate-800">{resultData.training.quiz_title}</span>
                              <p className="text-slate-500 mt-0.5">{resultData.training.quiz_description}</p>
                            </div>

                            <div className="space-y-4">
                              {resultData.training.questions?.map((q: any, idx: number) => (
                                <div key={idx} className="bg-white p-4 rounded-xl border border-slate-100 space-y-3">
                                  <span className="font-extrabold text-slate-800 block">سؤال {idx + 1}: {q.question_text}</span>
                                  <div className="grid grid-cols-2 gap-2 text-xs font-normal">
                                    {q.options?.map((opt: string, optIdx: number) => (
                                      <div key={optIdx} className="bg-slate-50 p-2 rounded border border-slate-100">
                                        {opt}
                                      </div>
                                    ))}
                                  </div>
                                  <div className="text-[11px] text-emerald-800 font-bold bg-emerald-50 p-2 rounded">
                                    الإجابة الصحيحة: {q.correct_answer}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Category E: Board Room & Conversations */}
                  {activeTab === "board_room" && (
                    <div className="space-y-6">
                      <div className="border border-slate-100 rounded-2xl p-5 md:p-6 space-y-4 font-sans">
                        <div className="flex items-center gap-3 border-b pb-4">
                          <span className="p-2 bg-violet-100 text-violet-700 rounded-xl">
                            <Sparkles className="w-5 h-5 animate-pulse" />
                          </span>
                          <div>
                            <h3 className="text-md font-bold text-slate-800">تفاصيل مداولات مجلس الإدارة الافتراضي (Boardroom Minutes)</h3>
                            <p className="text-xs text-slate-500 mt-1">تنسيق موازٍ ومتقاطع للأفكار بين خمسة عملاء مستقلين يمتلكون تخصصات صارمة وصلاحية الفحص والتدقيق التبادلية.</p>
                          </div>
                        </div>

                        {/* Speech Thread */}
                        <div className="space-y-4 pt-2">
                          {Array.isArray(resultData.boardMeetingTranscript) && resultData.boardMeetingTranscript.length > 0 ? (
                            resultData.boardMeetingTranscript.map((transcript: any, idx: number) => (
                              <div key={idx} className="bg-slate-50/50 border border-slate-100 p-4 rounded-2xl space-y-2 relative">
                                <div className="flex items-center gap-2 justify-between">
                                  <div className="flex items-center gap-1.5">
                                    <span className="w-2 h-2 bg-violet-500 rounded-full shrink-0 animate-pulse" />
                                    <span className="font-extrabold text-xs text-slate-800">{transcript.agent}</span>
                                    <span className="text-[10px] bg-violet-100 text-violet-700 px-2 py-0.5 rounded-full font-bold">{transcript.role}</span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 font-mono">Status: {transcript.status}</span>
                                </div>
                                <p className="text-xs text-slate-650 leading-relaxed whitespace-pre-wrap">{transcript.text}</p>
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-8 text-slate-405 text-xs">لا تتوفر مخرجات من مداولات مجلس الإدارة حالياً.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Category F: Agent Simulation & Terminal Feed */}
                  {activeTab === "agent_simulation" && (
                    <div className="space-y-6 font-sans">
                      {/* Simulation Analytics & Status Row */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-right">
                        <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 flex flex-row-reverse items-center justify-between gap-3">
                          <div className="flex flex-row-reverse items-center gap-3">
                            <div className="p-3 bg-violet-100 text-violet-700 rounded-xl">
                              <Cpu className="w-5 h-5 animate-pulse" />
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-normal">محرك الحوسبة والوكلاء</span>
                              <span className="text-xs font-black text-slate-700">5 وكلاء تنفيذيون نشطون</span>
                            </div>
                          </div>
                        </div>

                        <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 flex flex-row-reverse items-center justify-between gap-3">
                          <div className="flex flex-row-reverse items-center gap-3">
                            <div className="p-3 bg-emerald-100 text-emerald-700 rounded-xl">
                              <Database className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-normal">حالة مزامنة المعاملات</span>
                              <span className="text-xs font-black text-slate-700">مكتملة (Committed) بنسبة 100%</span>
                            </div>
                          </div>
                        </div>

                        <div className="border border-slate-100 bg-slate-50/50 rounded-2xl p-4 flex flex-row-reverse items-center justify-between gap-3">
                          <div className="flex flex-row-reverse items-center gap-3">
                            <div className="p-3 bg-amber-100 text-amber-700 rounded-xl">
                              <Activity className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-[10px] text-slate-400 block font-normal">تقدم محاكاة السجلات الحية</span>
                              <span className="text-xs font-black text-slate-700">
                                {displayedLogs.length === 0 ? "بانتظار البدء" : displayedLogs.length === getSimulationLogs(resultData, seedInput, answers).length ? "مكتمل التزامن" : `جاري التوليد (${displayedLogs.length}/${getSimulationLogs(resultData, seedInput, answers).length})`}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Schematic Workflow Topology Map */}
                      <div className="border border-slate-100 rounded-2xl p-5 space-y-4 text-right">
                        <h3 className="text-xs font-black text-slate-700 flex flex-row-reverse items-center gap-1.5 uppercase tracking-wider">
                          <Layers className="w-4 h-4 text-violet-600" /> طوبولوجيا وبنية الاتصالات للعملاء المستقلين
                        </h3>
                        <p className="text-[11px] text-slate-500 font-normal leading-relaxed">
                          خريطة تعامد المسارات بين العملاء المستقلين. يتكامل كل قسم مع قواعد البيانات دورياً بموجب الصلاحيات والتدقيق التبادلي لضمان تجانس مخرجات البيزنس.
                        </p>
                        
                        {/* Interactive flow indicators */}
                        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 pt-2 text-center text-[10px]" style={{ direction: "rtl" }}>
                          {[
                            { step: 1, name: "المحاور", color: "border-purple-200 bg-purple-50/10 text-purple-700", desc: "صياغة المطلب الأساسي" },
                            { step: 2, name: "المايسترو CEO", color: "border-pink-200 bg-pink-50/10 text-pink-700", desc: "توزيع الصلاحيات و OKRs" },
                            { step: 3, name: "أخصائي العمليات", color: "border-cyan-200 bg-cyan-50/10 text-cyan-700", desc: "تصميم SOPs والمسارات" },
                            { step: 4, name: "تنظيم المشاريع", color: "border-yellow-200 bg-yellow-50/10 text-yellow-750", desc: "مصفوفة RACI والكانبان" },
                            { step: 5, name: "المخاطر والجودة", color: "border-orange-200 bg-orange-50/10 text-orange-700", desc: "ثغرات الجودة و CAPA" },
                            { step: 6, name: "النمو والتسويق", color: "border-red-200 bg-red-50/10 text-red-700", desc: "تسييل CRM والتسويق" }
                          ].map((agent, index) => {
                            const isPast = simLogIndex >= (index === 0 ? 3 : index === 1 ? 6 : index === 2 ? 11 : index === 3 ? 15 : index === 4 ? 20 : 25);
                            return (
                              <div key={index} className={`border p-2.5 rounded-xl flex flex-col justify-between items-center transition ${agent.color} ${isPast ? "opacity-100 border-2 shadow-sm font-extrabold" : "opacity-40"}`}>
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center font-bold mb-1 text-[9px] ${isPast ? "bg-white border text-inherit animate-pulse" : "bg-slate-100 text-slate-400"}`}>
                                  {agent.step}
                                </span>
                                <span className="block font-black text-[11px] mb-0.5">{agent.name}</span>
                                <span className="block text-[8px] opacity-75 leading-tight font-normal">{agent.desc}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Controls Toolbar Panel */}
                      <div className="border border-slate-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/30 font-sans">
                        <div className="flex flex-wrap items-center gap-3">
                          {/* Play / Pause Toggle */}
                          <button
                            onClick={() => setSimPlaying(!simPlaying)}
                            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition ${
                              simPlaying 
                                ? "bg-amber-600 hover:bg-amber-700 text-white" 
                                : "bg-violet-600 hover:bg-violet-700 text-white"
                            }`}
                          >
                            {simPlaying ? (
                              <>
                                <Pause className="w-3.5 h-3.5" /> إيقاف المحاكاة مؤقتاً
                              </>
                            ) : (
                              <>
                                <Play className="w-3.5 h-3.5" /> استئناف التغذية الحية
                              </>
                            )}
                          </button>

                          {/* REPLAY simulation button */}
                          <button
                            onClick={restartSimulation}
                            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition"
                          >
                            <RefreshCw className="w-3.5 h-3.5" /> إعادة تشغيل محاكاة التأسيس
                          </button>

                          {/* Speed Toggle */}
                          <div className="flex items-center gap-1 bg-white border rounded-xl p-1 shrink-0">
                            <span className="text-[10px] text-slate-400 px-2 font-normal">سرعة العرض:</span>
                            {[
                              { id: 1, label: "1x" },
                              { id: 2, label: "2x" },
                              { id: 5, label: "5x" },
                              { id: 999, label: "فوري" }
                            ].map((speed) => (
                              <button
                                key={speed.id}
                                onClick={() => setSimSpeed(speed.id as any)}
                                className={`text-[10px] font-bold px-2 py-1 rounded-lg transition ${
                                  simSpeed === speed.id 
                                    ? "bg-slate-800 text-white" 
                                    : "text-slate-500 hover:text-slate-800"
                                }`}
                              >
                                {speed.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Search Input bar */}
                        <div className="relative max-w-xs w-full">
                          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                          <input
                            type="text"
                            value={simSearchTerm}
                            onChange={(e) => setSimSearchTerm(e.target.value)}
                            placeholder="بحث في سجل العمليات التشغيلية..."
                            className="w-full text-xs p-2.5 pl-9 border outline-none rounded-xl focus:ring-1 focus:ring-violet-500 font-normal transition text-right pr-4"
                          />
                        </div>
                      </div>

                      {/* Interactive Agent Filtering Tabs */}
                      <div className="flex gap-1.5 overflow-x-auto pb-1 text-xs justify-end" style={{ direction: "rtl" }}>
                        {[
                          { id: "all", label: "كافة العمليات", count: displayedLogs.length },
                          { id: "system", label: "النظام (System)", count: displayedLogs.filter(l => l.category === "system").length },
                          { id: "interviewer", label: "المحاور (Interviewer)", count: displayedLogs.filter(l => l.category === "interviewer").length },
                          { id: "ceo", label: "المايسترو (CEO)", count: displayedLogs.filter(l => l.category === "ceo").length },
                          { id: "process", label: "العمليات (Process)", count: displayedLogs.filter(l => l.category === "process").length },
                          { id: "pm", label: "المشاريع (PM)", count: displayedLogs.filter(l => l.category === "pm").length },
                          { id: "risk", label: "الجودة والمخاطر (Risk/QA)", count: displayedLogs.filter(l => l.category === "risk").length },
                          { id: "growth", label: "النمو والتسويق (Growth/CRM)", count: displayedLogs.filter(l => l.category === "growth").length },
                        ].map((cat) => (
                          <button
                            key={cat.id}
                            onClick={() => setSimAgentFilter(cat.id)}
                            className={`px-3 py-1.5 rounded-xl border text-[11px] font-bold whitespace-nowrap transition ${
                              simAgentFilter === cat.id
                                ? "bg-violet-50 text-violet-700 border-violet-200"
                                : "bg-white text-slate-500 border-slate-100 hover:text-slate-800"
                            }`}
                          >
                            {cat.label} <span className="bg-slate-100 text-slate-500 px-1.5 rounded-full text-[9px] font-normal ml-0.5">{cat.count}</span>
                          </button>
                        ))}
                      </div>

                      {/* High-Contrast Interactive UNIX Shell Console Terminal Container */}
                      <div className="bg-[#0B0F19] text-[#E4E6EB] font-mono p-5 rounded-3xl border border-slate-800 shadow-2xl relative overflow-hidden text-[11px] leading-relaxed">
                        
                        {/* Console terminal header frame */}
                        <div className="flex flex-row-reverse items-center justify-between border-b border-slate-800/80 pb-3 mb-4 select-none">
                          <div className="flex items-center gap-1.5">
                            <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block" />
                            <span className="w-3 h-3 rounded-full bg-yellow-400/80 inline-block" />
                            <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                            <span className="text-[10px] text-slate-500 ml-2 font-mono">root@boardroom-kubernetes:~</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] text-emerald-500 flex items-center gap-1.5 font-bold animate-pulse">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" /> LIVE DEPLOYING CHANNEL ACTIVE
                            </span>
                            <span className="text-[9px] bg-slate-800 text-slate-400 px-2 py-0.5 rounded font-mono">POSTGRES-SYNC</span>
                          </div>
                        </div>

                        {/* Top terminal message branding */}
                        <div className="opacity-60 text-[10px] leading-relaxed mb-4 select-none text-right font-mono" style={{ direction: "ltr" }}>
                          # Multi-Agent Transaction Sync Protocol v2.8.2 (May 2026 Supabase standard)<br />
                          # System handshaking verified on local host tunnel 0.0.0.0:3000.<br />
                          # Executing operational telemetry trace for company bootstrap index.<br />
                          -------------------------------------------------------------------------------
                        </div>

                        {/* scrolling output window */}
                        <div className="space-y-4 max-h-[380px] overflow-y-auto pr-1 text-right leading-relaxed font-mono">
                          {displayedLogs.filter((log) => {
                            const term = (simSearchTerm || '').toLowerCase();
                            const matchesFilter = simAgentFilter === "all" || log.category === simAgentFilter;
                            const matchesSearch = !simSearchTerm.trim() || 
                              (log.desc || '').toLowerCase().includes(term) ||
                              (log.phase || '').toLowerCase().includes(term) ||
                              (log.agentName || '').toLowerCase().includes(term) ||
                              (log.dbOperation || '').toLowerCase().includes(term);
                            return matchesFilter && matchesSearch;
                          }).length > 0 ? (
                            displayedLogs.filter((log) => {
                              const term = (simSearchTerm || '').toLowerCase();
                              const matchesFilter = simAgentFilter === "all" || log.category === simAgentFilter;
                              const matchesSearch = !simSearchTerm.trim() || 
                                (log.desc || '').toLowerCase().includes(term) ||
                                (log.phase || '').toLowerCase().includes(term) ||
                                (log.agentName || '').toLowerCase().includes(term) ||
                                (log.dbOperation || '').toLowerCase().includes(term);
                              return matchesFilter && matchesSearch;
                            }).map((log, index) => (
                              <div key={index} className="space-y-1 pb-1 pt-1 border-b border-slate-800/10">
                                <div className="flex flex-row-reverse items-center gap-2 flex-wrap text-right justify-start">
                                  <span className="text-slate-500 text-[10px] shrink-0">[{log.time}]</span>
                                  <span className={`px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded font-bold text-[9px] tracking-wide ${log.color}`}>
                                    {log.agent}
                                  </span>
                                  <span className="text-violet-400 font-bold text-[10px]">{log.phase}</span>
                                  
                                  {log.dbOperation !== "N/A" && log.dbOperation !== "N/A (Context Broadcast)" && log.dbOperation !== "N/A (Context state lock)" && log.dbOperation !== "N/A (Agent orchestration runtime)" && log.dbOperation !== "N/A (Memory cache sync)" && log.dbOperation !== "N/A (Strategic constraint evaluation)" && log.dbOperation !== "N/A (Memory sequence assembly)" && log.dbOperation !== "N/A (Work Breakdown Structure initialization)" && log.dbOperation !== "N/A (Resource loading distribution)" && log.dbOperation !== "N/A (Vulnerability scan triggers)" && log.dbOperation !== "N/A (Compliance templates lock)" && log.dbOperation !== "N/A (Commercial analytics init)" && log.dbOperation !== "N/A (Copywriting cache compilation)" && log.dbOperation !== "N/A (CRM layout calculation)" && log.dbOperation !== "N/A (Knowledge database index mapping)" && (
                                    <span className="bg-emerald-950/40 text-emerald-400 border border-emerald-900/50 px-1.5 py-0.5 rounded text-[8px] font-mono shrink-0">
                                      SQL TRANSACTION COMMITTED
                                    </span>
                                  )}
                                </div>
                                <div className="text-[#A9B2C3] font-sans text-xs mt-0.5 whitespace-pre-wrap leading-relaxed justify-start text-right">
                                  {log.desc}
                                </div>
                                {log.dbOperation !== "N/A" && (
                                  <div className="bg-slate-900/60 p-2 text-blue-300 font-mono text-[9px] rounded-lg mt-1 border border-slate-800 border-dashed select-all flex items-center justify-between gap-2 overflow-x-auto" style={{ direction: "ltr" }}>
                                    <span className="text-[10px] text-slate-500 font-mono shrink-0">QUERY ID: {index + 1092} ➔</span>
                                    <code>{log.dbOperation}</code>
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-10 text-slate-500 text-xs font-sans">
                              {simSearchTerm.trim() 
                                ? "لا توجد نتائج بحث تطابق المفردات المدخلة." 
                                : "بانتظار تدفق السجلات والمحاكاة الحية... اضغط على زر 'استئناف التغذية الحية' للتشغيل."
                              }
                            </div>
                          )}
                          
                          {/* Pulsing shell cursor */}
                          {simPlaying && simLogIndex < getSimulationLogs(resultData, seedInput, answers).length && (
                            <div className="flex flex-row-reverse items-center justify-start gap-1.5 text-xs text-violet-400 pl-4 py-2 font-mono">
                              <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              <span>جاري تدفّق العمليات التشغيلية وكتابة السجل...</span>
                            </div>
                          )}

                          <div ref={terminalEndRef} />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* COMPACT FLOATING MODAL: AI REAL-TIME EDIT / DIRECT MANUAL EDIT */}
      <AnimatePresence>
        {editingItem && (
          <div className="fixed inset-0 bg-slate-900/40 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border text-right max-w-lg w-full rounded-2xl p-6 shadow-2xl relative"
            >
              <h3 className="text-md font-black text-slate-900 flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-violet-600 shrink-0" />
                تعديل وتدقيق مخرجات الذكاء الاصطناعي
              </h3>

              {/* Textarea for Direct Manual Modification */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-black text-slate-700 mb-2">
                    ✍️ تعديل النص يدوياً بشكل مباشر:
                  </label>
                  <textarea
                    value={manualEditText}
                    onChange={(e) => setManualEditText(e.target.value)}
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-violet-500 min-h-[110px] leading-relaxed transition font-sans"
                    placeholder="امسح واكتب النص المعدل الذي تريده مباشرة..."
                  />
                  <div className="flex justify-start mt-1.5 font-sans">
                    <button
                      onClick={handleSaveManualEdit}
                      className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition"
                    >
                      <span>حفظ التعديل اليدوي المباشر ✓</span>
                    </button>
                  </div>
                </div>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-slate-100"></div>
                  <span className="flex-shrink mx-4 text-[10px] text-slate-400 font-bold uppercase font-sans">أو تحسين بالذكاء الاصطناعي (مساعد رقمي)</span>
                  <div className="flex-grow border-t border-slate-100"></div>
                </div>

                <div>
                  <label className="block text-xs font-black text-slate-700 mb-2 font-sans">
                    🤖 اكتب توجيهات التحسين (مثال: أعد الصياغة بالعامية أو اجعلها أكثر حماساً):
                  </label>
                  <textarea
                    value={promptInstruction}
                    onChange={(e) => setPromptInstruction(e.target.value)}
                    placeholder="أعد الصياغة لتكون أكثر جاذبية، أو أضف تفاصيل أكثر دقة..."
                    className="w-full text-xs p-3 border border-slate-200 rounded-xl outline-none focus:ring-1 focus:ring-violet-500 min-h-[80px] leading-relaxed transition font-sans"
                  />
                  <div className="flex justify-start mt-1.5 font-sans">
                    <button
                      onClick={handleApplyInlineEdit}
                      disabled={!promptInstruction.trim() || isUpdatingField}
                      className="px-4 py-1.5 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white rounded-lg text-[11px] font-bold flex items-center gap-1.5 transition"
                    >
                      {isUpdatingField ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>جاري مراجعة الذكاء...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3 h-3" />
                          <span>تطبيق التحسين الذكي ⚡</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 justify-end border-t pt-4 mt-6 font-sans">
                <button
                  onClick={() => setEditingItem(null)}
                  disabled={isUpdatingField}
                  className="px-4 py-2 border rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition"
                >
                  إغلاق النافذة
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Global helper to compile step-by-step real-time simulation logs for the Autonmous Multi-Agent System
function getSimulationLogs(data: any, seed: string, ans: any[]) {
  const isAr = /[\u0600-\u06FF]/.test(seed || "");
  return [
    {
      time: "09:35:00",
      agent: "SYSTEM",
      agentName: isAr ? "النظام الأساسي" : "SYSTEM RUNTIME",
      type: "handshake",
      category: "system",
      color: "text-blue-400",
      phase: isAr ? "تهيئة بيئة التشغيل" : "Environment Init",
      desc: isAr 
        ? "تأمين منفذ الاتصال بالمنصة الرقمية 3000... تم تفعيل بروتوكول المصافحة العكسية بنجاح."
        : "Securing container runtime environmental handshake on Port 3000... Handshake accepted.",
      dbOperation: "N/A (Check container state)"
    },
    {
      time: "09:35:01",
      agent: "SYSTEM",
      agentName: isAr ? "النظام الأساسي" : "SYSTEM RUNTIME",
      type: "db_rule",
      category: "system",
      color: "text-blue-400",
      phase: isAr ? "إدارة الصلاحيات وقواعد البيانات" : "PostgreSQL Migrations & Permissions",
      desc: isAr
        ? "المهاجرة الأمنية (SQL Integration): تفعيل قواعد May 2026 لقاعدة Supabase. منح صلاحية GRANT SELECT, INSERT, UPDATE, DELETE الصارمة للمستخدمين الموثقين دورياً."
        : "DB Migration Hook: postgresql schema updated with Supabase May 2026 explicit GRANT rules. Standard permissions fully enforced.",
      dbOperation: "GRANT ALL ON public.my_new_table TO postgres, service_role, authenticated;"
    },
    {
      time: "09:35:02",
      agent: "INTERVIEWER",
      agentName: isAr ? "المحاور الاستراتيجي" : "Interviewer Agent",
      type: "scope_analysis",
      category: "interviewer",
      color: "text-purple-400",
      phase: isAr ? "صياغة نطاق المشروع" : "Project Conception & Scope Analysis",
      desc: isAr
        ? `بدء صياغة المتطلبات الميدانية الاستشارية لفكرة المشروع: "${(seed || "").substring(0, 80)}...". جاري دمج وتحليل الإجابات الواردة من العميل.`
        : `Formulating core requirements & onboarding details for seed concept: "${(seed || "").substring(0, 80)}...". Compiling multi-department prerequisites.`,
      dbOperation: `SELECT FROM user_sessions WHERE user_id = 'current' ORDER BY created_at DESC;`
    },
    {
      time: "09:35:04",
      agent: "INTERVIEWER",
      agentName: isAr ? "المحاور الاستراتيجي" : "Interviewer Agent",
      type: "eval",
      category: "interviewer",
      color: "text-purple-400",
      phase: isAr ? "جاهزية واستيفاء الفكرة" : "Context Quality Evaluation",
      desc: isAr
        ? `تقييم الاستشارة الاستراتيجية مكتمل بنجاح بعد إجراء ${ans?.length || 3} أسئلة توضيحية. تم استيفاء الفئة المستهدفة وجداول التسعير والتحليل المحلي للفرص.`
        : `Context qualification algorithm returns green after ${ans?.length || 3} detailed clarification steps. Verified audience targeting, local constraints, and competitor voids.`,
      dbOperation: "N/A (Strategic constraint evaluation)"
    },
    {
      time: "09:35:05",
      agent: "INTERVIEWER",
      agentName: isAr ? "المحاور الاستراتيجي" : "Interviewer Agent",
      type: "db_write",
      category: "interviewer",
      color: "text-emerald-400 font-bold",
      phase: isAr ? "اعتماد وثيقة النطاق" : "SOW Integration Write-lock",
      desc: isAr
        ? "حفظ واعتماد وثيقة نطاق العمل الرقمية الأساسية المعمدة من المحاور الاستراتيجي ونشرها لبقية أعضاء المجلس الافتراضي للتنفيذ المتناهي."
        : "Committed the master digital Scope of Work Markdown into the centralized workspace directory. Operational boundaries locked.",
      dbOperation: "INSERT INTO company_scopes (company_id, scope_document_html, generated_by_agent) VALUES (1, '<markdown>', 'interviewer_agent');"
    },
    {
      time: "09:35:07",
      agent: "CEO",
      agentName: isAr ? "المايسترو والموجه" : "CEO / Orchestrator Agent",
      type: "ceo_spawning",
      category: "ceo",
      color: "text-pink-400",
      phase: isAr ? "استدعاء وتوجيه مجلس الإدارة" : "Orchestration & Virtual Board Setup",
      desc: isAr
        ? "بدء تشغيل مجلس الإدارة الافتراضي للذكاء الاصطناعي واستدعاء الأعضاء التنفيذيين. توجيه المايسترو: تقسيم نطاق العمل إلى موديولات مستقلة منسقة."
        : "Bootstrapping Virtual Board Room with executive CEO instructions. Breaking down the scope document into parallel departmental actions.",
      dbOperation: "N/A (Agent orchestration runtime)"
    },
    {
      time: "09:35:08",
      agent: "CEO",
      agentName: isAr ? "المايسترو والموجه" : "CEO / Orchestrator Agent",
      type: "strategy_decision",
      category: "ceo",
      color: "text-pink-400",
      phase: isAr ? "التخطيط الاستراتيجي وصياغة OKRs" : "Strategy Coordinates Extraction",
      desc: isAr
        ? `استخراج التنسيقات الاستراتيجية الكبرى: SWOT ذكي، صياغة ${data?.businessModel?.okrs?.length || 3} أهداف استراتيجية OKR رئيسية متعاقبة، و ${data?.businessModel?.milestones?.length || 4} نقاط زمنية فارقة (Milestones).`
        : `Decomposing business parameters: Formulating comprehensive SWOT quadrants, defining ${data?.businessModel?.okrs?.length || 3} objective targets, and outlining ${data?.businessModel?.milestones?.length || 4} roadmap milestones.`,
      dbOperation: "N/A (Memory cache sync)"
    },
    {
      time: "09:35:09",
      agent: "CEO",
      agentName: isAr ? "المايسترو والموجه" : "CEO / Orchestrator Agent",
      type: "db_write",
      category: "ceo",
      color: "text-emerald-400",
      phase: isAr ? "حقن نموذج العمل في قاعدة البيانات" : "Persisting Enterprise Core Models",
      desc: isAr
        ? `حفظ الهيكلية الأساسية في جدول نماذج الأعمال للشركة ID = 1.`
        : `Successfully persisted the master business representation matrix into db.business_models.`,
      dbOperation: `INSERT INTO db.business_models (company_id, swot_strengths, swot_weaknesses) VALUES (1, ..., ...);`
    },
    {
      time: "09:35:10",
      agent: "CEO",
      agentName: isAr ? "المايسترو والموجه" : "CEO / Orchestrator Agent",
      type: "db_write",
      category: "ceo",
      color: "text-emerald-400",
      phase: isAr ? "جدولة نقاط المعالم والأهداف" : "Batch Seeding Milestones",
      desc: isAr
        ? `كتابة ${data?.businessModel?.okrs?.length || 3} صفوف في جدول الأهداف وتخزين ${data?.businessModel?.milestones?.length || 4} محطة استراتيجية مؤرخة.`
        : `Batch inserting ${data?.businessModel?.okrs?.length || 3} OKR rows and ${data?.businessModel?.milestones?.length || 4} key milestone records indexed on real timelines.`,
      dbOperation: "INSERT INTO db.okrs (objective, key_results) VALUES (?, ?); INSERT INTO db.milestones (title, deadline) VALUES (?, ?);"
    },
    {
      time: "09:35:11",
      agent: "CEO",
      agentName: isAr ? "المايسترو والموجه" : "CEO / Orchestrator Agent",
      type: "broadcast",
      category: "ceo",
      color: "text-pink-400",
      phase: isAr ? "بث التوجيهات التشغيلية" : "Distributing Departmental Tasks",
      desc: isAr
        ? "بث إشارات التفعيل والتعليمات التخصصية بالتوازي إلى العملاء الفرعيين (العمليات، المشاريع، المخاطر، والنمو). بدء الاتصال."
        : "CEO issuing execution guidelines and API context keys concurrently to Process, PM, Risks, and Marketing sub-agents. Async channel: online.",
      dbOperation: "N/A (Context Broadcast)"
    },
    {
      time: "09:35:13",
      agent: "PROCESS",
      agentName: isAr ? "أخصائي هندسة العمليات" : "Process & SOP Agent",
      type: "task_acquire",
      category: "process",
      color: "text-cyan-400",
      phase: isAr ? "تلقي مهام صياغة العمليات" : "Acquiring Context",
      desc: isAr
        ? "تلقي إشارة المايسترو وتأكيد مصفوفة النطاق الرقمي. بدء صياغة الإجراءات القياسية لضمان سلاسة الخدمة."
        : "CEO signals captured. Commencing structural mapping of workflows and Standard Operating Procedures (SOPs) based on seed parameters.",
      dbOperation: "N/A (Context state lock)"
    },
    {
      time: "09:35:14",
      agent: "PROCESS",
      agentName: isAr ? "أخصائي هندسة العمليات" : "Process & SOP Agent",
      type: "intel_decision",
      category: "process",
      color: "text-cyan-400",
      phase: isAr ? "هندسة الإجراءات القياسية" : "SOP Pipeline Engineering",
      desc: isAr
        ? `صياغة الإجراء القياسي الأساسي: "${data?.sop?.title || 'إجراء التشغيل المتكامل'}". دمج عدد ${data?.sop?.steps?.length || 4} خطوات تشغيلية متتابعة مع مؤشرات قياس أداء صارمة.`
        : `Designed master operational SOP: "${data?.sop?.title || 'Core Operational SOP'}" categorized under "${data?.sop?.process_type}". Configured ${data?.sop?.steps?.length || 4} sequence compliance gates.`,
      dbOperation: "N/A (Memory sequence assembly)"
    },
    {
      time: "09:35:15",
      agent: "PROCESS",
      agentName: isAr ? "أخصائي هندسة العمليات" : "Process & SOP Agent",
      type: "db_write",
      category: "process",
      color: "text-emerald-400 font-bold",
      phase: isAr ? "تسجيل الإجراء القياسي" : "Writing Core SOP Configurations",
      desc: isAr
        ? `إدراج رأس الـ SOP كفئة "${data?.sop?.process_type || 'Operational'}" في جدول db.sops مع المعايير المستهدفة.`
        : `Inserted main SOP header categorized as '${data?.sop?.process_type || 'Operational'}' inside db.sops, returning master index key.`,
      dbOperation: `INSERT INTO db.sops (title, process_type, objective, company_id) VALUES ('${data?.sop?.title || 'SOP Blueprint'}', ..., ..., 1) RETURNING id;`
    },
    {
      time: "09:35:16",
      agent: "PROCESS",
      agentName: isAr ? "أخصائي هندسة العمليات" : "Process & SOP Agent",
      type: "db_write",
      category: "process",
      color: "text-emerald-400 font-bold",
      phase: isAr ? "حقن خطوات الـ SOP التفصيلية" : "Batch Seeding SOP Checkpoints",
      desc: isAr
        ? `تنفيذ التغذية المتعددة لجميع خطوات الـ SOP الـ ${data?.sop?.steps?.length || 4} مدعومة بالنتائج المتوقعة وربط الـ SLAs.`
        : `Batch writing ${data?.sop?.steps?.length || 4} detailed execution steps matching checkpoints with expected verification outputs in db.sop_steps.`,
      dbOperation: `INSERT INTO db.sop_steps (sop_id, step_number, step_description, expected_result) VALUES (?, ?, ?, ?);`
    },
    {
      time: "09:35:18",
      agent: "PM",
      agentName: isAr ? "أخصائي تنظيم المشاريع" : "Project Management Agent",
      type: "task_acquire",
      category: "pm",
      color: "text-yellow-400",
      phase: isAr ? "استلام هيكل الإجراءات" : "Importing Process Templates",
      desc: isAr
        ? `رصد خطوات الإجراء القياسي "${data?.sop?.title || 'إجراء التشغيل'}". البدء بتحويل مخرجات هندسة العمليات إلى مهام تأسيسية حية في لوحة الكانبان وعمل تفريغ الصلاحيات.`
        : `Operational flow maps acquired. Transforming SOP sequence items into live project sprints on the Kanban task board and mapping RACI responsibility matrix indices.`,
      dbOperation: "N/A (Work Breakdown Structure initialization)"
    },
    {
      time: "09:35:19",
      agent: "PM",
      agentName: isAr ? "أخصائي تنظيم المشاريع" : "Project Management Agent",
      type: "scheduling_decision",
      category: "pm",
      color: "text-yellow-400",
      phase: isAr ? "صياغة وتكليف RACI لوحة المهام" : "RACI Authority Allocation Strategy",
      desc: isAr
        ? `فرز هويات الموظفين والمسؤوليات: تقييم الأدوار لضمان عدم حدوث تشابك إداري. تكليف وتوزيع مصفوفة التكاليف RACI لمختلف مهام التأسيس.`
        : `Generating strict RASCI role vectors (Responsible, Accountable, Consulted, Informed) for each task to guarantee clean organizational alignment and zero workflow overlap.`,
      dbOperation: "N/A (Resource loading distribution)"
    },
    {
      time: "09:35:21",
      agent: "PM",
      agentName: isAr ? "أخصائي تنظيم المشاريع" : "Project Management Agent",
      type: "db_write",
      category: "pm",
      color: "text-emerald-400 font-bold",
      phase: isAr ? "حقن مهام الكانبان" : "Seeding Live Kanban Board",
      desc: isAr
        ? `كتابة وجدولة ${data?.tasks?.length || 5} بطاقات مهام فورية وتخصيص مستويات الأولوية (High, Medium, Low) في جدول المهام db.tasks.`
        : `Populated ${data?.tasks?.length || 5} active setup tickets inside db.tasks, mapping prioritize scales (high|medium|low) and assignees.`,
      dbOperation: `INSERT INTO db.tasks (title, description, priority, column_state) VALUES (?, ?, ?, 'todo');`
    },
    {
      time: "09:35:22",
      agent: "PM",
      agentName: isAr ? "أخصائي تنظيم المشاريع" : "Project Management Agent",
      type: "db_write",
      category: "pm",
      color: "text-emerald-400 font-bold",
      phase: isAr ? "تسجيل مصفوفة RACI الصلاحيات" : "Seeding Role Matrix Rows",
      desc: isAr
        ? `حفظ مصفوفة RACI الموزعة لعدد ${data?.raci?.length || 4} أدوار وصلاحيات قيادية في جدول db.raci_matrix لضمان المرجعية.`
        : `Batch seeded ${data?.raci?.length || 4} explicit entries associating process items to stakeholder RACI roles inside db.raci_matrix.`,
      dbOperation: `INSERT INTO db.raci_matrix (step_number, role_name, role_type) VALUES (?, ?, ?);`
    },
    {
      time: "09:35:24",
      agent: "RISK",
      agentName: isAr ? "أخصائي معالجة المخاطر ومراقبة الجودة" : "Risk & QA Agent",
      type: "safety_check",
      category: "risk",
      color: "text-orange-400",
      phase: isAr ? "اختبار المرونة التشغيلية" : "Preemptive Stress Testing",
      desc: isAr
        ? "استيراد مسارات الحركة والعمليات لتقييم عوامل الفشل التشغيلي أو المالي أو التقني أو قوى السوق استباقياً."
        : "Reviewing all operational nodes to proactively predict failure, safety compliance issues, or strategic vulnerabilities through security models.",
      dbOperation: "N/A (Vulnerability scan triggers)"
    },
    {
      time: "09:35:25",
      agent: "RISK",
      agentName: isAr ? "أخصائي معالجة المخاطر ومراقبة الجودة" : "Risk & QA Agent",
      type: "hazard_decision",
      category: "risk",
      color: "text-orange-400",
      phase: isAr ? "تقييم وتخفيف المخاطر الاستباقية" : "Analyzing Threat Severity Scores",
      desc: isAr
        ? `رصد وتوثيق عدد ${data?.risks?.length || 4} ثغرات خطرة. تحديد درجات الاحتمالية (Probability 1-5) والأثر (Impact 1-5) وبناء خطط التخفيف الاستباقية.`
        : `Registered ${data?.risks?.length || 4} potential vulnerabilities back-to-back. Scored probability and impact, drafting robust defensive mitigation blueprints.`,
      dbOperation: "N/A (SLA drift forecasting)"
    },
    {
      time: "09:35:26",
      agent: "RISK",
      agentName: isAr ? "أخصائي معالجة المخاطر ومراقبة الجودة" : "Risk & QA Agent",
      type: "qa_compliance_decision",
      category: "risk",
      color: "text-orange-400",
      phase: isAr ? "تحليل انحرافات الجودة CAPA" : "Formulating Preventive CAPA Systems",
      desc: isAr
        ? `توقّع ثغرات الجودة: صياغة ${data?.qaNcrs?.length || 2} حالات عدم مطابقة مفترضة (QA Non-Conformances) وتجهيز السيناريوهات العلاجية والتصحيحية CAPA.`
        : `Designed CAPA (Corrective and Preventive Actions) matrices for ${data?.qaNcrs?.length || 2} simulated field quality compromises to ensure zero deviation from customer SLAs.`,
      dbOperation: "N/A (Compliance templates lock)"
    },
    {
      time: "09:35:27",
      agent: "RISK",
      agentName: isAr ? "أخصائي معالجة المخاطر ومراقبة الجودة" : "Risk & QA Agent",
      type: "db_write",
      category: "risk",
      color: "text-emerald-400 font-bold",
      phase: isAr ? "حفظ سجل المخاطر والحوكمة" : "Writing Governance Registries",
      desc: isAr
        ? `توليد وحفظ سجل المخاطر الأساسية الـ ${data?.risks?.length || 4} في جدول db.risks لتكون مرجع الحوكمة.`
        : `Successfully written ${data?.risks?.length || 4} defensive contingency rules to db.risks with assigned mitigations.`,
      dbOperation: `INSERT INTO db.risks (name, description, category, probability, impact, mitigation_plan) VALUES (?, ?, ?, ?, ?, ?);`
    },
    {
      time: "09:35:28",
      agent: "RISK",
      agentName: isAr ? "أخصائي معالجة المخاطر ومراقبة الجودة" : "Risk & QA Agent",
      type: "db_write",
      category: "risk",
      color: "text-emerald-400 font-bold",
      phase: isAr ? "تسجيل لوائح ودورات انحرافات الجودة" : "Seeding QA NCR & CAPA Protocols",
      desc: isAr
        ? `تسجيل ${data?.qaNcrs?.length || 2} مستندات حالات انحراف الجودة (NCR) مع الأسباب الجذرية وخطط الاستجابة العاجلة في db.qa_ncrs.`
        : `Batch appended ${data?.qaNcrs?.length || 2} QA deviation profiles in db.qa_ncrs, tying root causes directly to preventive measures.`,
      dbOperation: `INSERT INTO db.qa_ncrs (description, severity, root_cause, action_plan) VALUES (?, ?, ?, ?);`
    },
    {
      time: "09:35:30",
      agent: "GROWTH",
      agentName: isAr ? "أخصائي تطوير المبيعات والتسويق الرقمي" : "Growth & Commercial Agent",
      type: "growth_spin",
      category: "growth",
      color: "text-red-400",
      phase: isAr ? "دراسة إمكانات التسييل والمبيعات" : "Monetization Strategy Parsing",
      desc: isAr
        ? "استعراض الأهداف الاستراتيجية ومؤشرات نجاح الإجراء لتهيئة المخططات الرقمية للمبيعات، وإعلانات الاستقطاب، والبرمجة التلقائية لكشف تسرب العملاء."
        : "Unpacking OKR limits and service steps to outline the multi-phase customer AIDA acquisition pipeline and service monetizations.",
      dbOperation: "N/A (Commercial analytics init)"
    },
    {
      time: "09:35:31",
      agent: "GROWTH",
      agentName: isAr ? "أخصائي تطوير المبيعات والتسويق الرقمي" : "Growth & Commercial Agent",
      type: "campaign_decision",
      category: "growth",
      color: "text-red-400",
      phase: isAr ? "هندسة حملة التسويق AIDA" : "Crafting Digital Launch Sprints",
      desc: isAr
        ? `تصميم حملة الاستقطاب مسبقة الصنع: "${data?.marketing?.campaign_title || 'حملة الافتتاح الكبرى'}" ومحورها الأساسي: "${data?.marketing?.goal || 'استقطاب العملاء وتجربة الخدمة الفاخرة'}". صياغة منشورات مستهدفة للشبكات السلكية والاجتماعية.`
        : `Formulated launch campaign: "${data?.marketing?.campaign_title || 'Growth Onslaught'}" targeting: "${data?.marketing?.goal || 'Acquisitions'}". Seeding multi-platform text copywriting.`,
      dbOperation: "N/A (Copywriting cache compilation)"
    },
    {
      time: "09:35:32",
      agent: "GROWTH",
      agentName: isAr ? "أخصائي تطوير المبيعات والتسويق الرقمي" : "Growth & Commercial Agent",
      type: "crm_seeds",
      category: "growth",
      color: "text-red-400",
      phase: isAr ? "تجهيز خط أنابيب مبيعات CRM" : "Simulating CRM Accounts & Contracts",
      desc: isAr
        ? `فرز سجلات العملاء وعروض المعاملات الفورية. بناء ${data?.crmCustomers?.length || 3} بروفايل عملاء حقيقيين في السوق الخليجي، وضخ ${data?.crmLeads?.length || 3} بطاقات فرص مبيعات و صفقات CRM فعالة.`
        : `Mapping targets to pipelines: structured ${data?.crmCustomers?.length || 3} test client data cards, ${data?.crmLeads?.length || 3} SQL leads, and active deal pipelines.`,
      dbOperation: "N/A (CRM layout calculation)"
    },
    {
      time: "09:35:33",
      agent: "GROWTH",
      agentName: isAr ? "أخصائي تطوير المبيعات والتسويق الرقمي" : "Growth & Commercial Agent",
      type: "kb_training",
      category: "growth",
      color: "text-red-400",
      phase: isAr ? "بناء قاعدة المعرفة والمسارات التدريبية" : "Structuring System Knowledge",
      desc: isAr
        ? `تأسيس ${data?.kb?.length || 2} مقالات حيوية في قاعدة المعرفة، وإعداد الدورة التدريبية لتدشين تأهيل الموظفين الجدد باسم: "${data?.training?.course_title || 'حقيبة التهيئة الأولى'}" الملحقة بأسئلة اختبار آلية.`
        : `Drafting ${data?.kb?.length || 2} operational SOP wiki articles and configuring staff training: "${data?.training?.course_title || 'Core Training'}" complete with quiz questionnaires.`,
      dbOperation: "N/A (Knowledge database index mapping)"
    },
    {
      time: "09:35:34",
      agent: "GROWTH",
      agentName: isAr ? "أخصائي تطوير المبيعات والتسويق الرقمي" : "Growth & Commercial Agent",
      type: "db_write",
      category: "growth",
      color: "text-emerald-400 font-bold",
      phase: isAr ? "تسجيل حملات ومنشورات التسويق" : "Persisting Media Content",
      desc: isAr
        ? "حفظ معلومات الحملة والمنشورات التسويقية المهيكلة لوسائل التواصل في جداول التسويق db.marketing_campaigns."
        : "Committed marketing objectives and social post items into db.marketing_campaigns.",
      dbOperation: "INSERT INTO db.marketing_campaigns (title, goal) VALUES (?, ?); INSERT INTO db.marketing_posts (campaign_id, platform, content) VALUES (?, ?, ?);"
    },
    {
      time: "09:35:35",
      agent: "GROWTH",
      agentName: isAr ? "أخصائي تطوير المبيعات والتسويق الرقمي" : "Growth & Commercial Agent",
      type: "db_write",
      category: "growth",
      color: "text-emerald-400 font-bold",
      phase: isAr ? "حقن العملاء والفرص في الـ CRM" : "Populating Sale Pipelines",
      desc: isAr
        ? `ضخ داتا جميع العملاء الـ ${data?.crmCustomers?.length || 3} والفرص القيادية والصفقات المالية الموزعة بقيم واعدة في جداول المعاملات db.crm_leads & db.crm_deals.`
        : `Batch writing ${data?.crmCustomers?.length || 3} accounts, active leads and deal portfolios into custom db.crm tables.`,
      dbOperation: "INSERT INTO db.crm_customers (name, email) VALUES (?, ?); INSERT INTO db.crm_deals (title, value) VALUES (?, ?);"
    },
    {
      time: "09:35:36",
      agent: "GROWTH",
      agentName: isAr ? "أخصائي تطوير المبيعات والتسويق الرقمي" : "Growth & Commercial Agent",
      type: "db_write",
      category: "growth",
      color: "text-emerald-400 font-bold",
      phase: isAr ? "تسجيل المناهج وحقيبة المعارف" : "Seeding Learning Models",
      desc: isAr
        ? `حفظ كتب المعرفة وتصنيف الدورة التدريبية الـ ${data?.training?.questions?.length || 3} أسئلة اختبار تقييم مهني في جداول db.training.`
        : `Persisted knowledge bases and course templates accompanied by professional quiz entities inside db.training tables.`,
      dbOperation: "INSERT INTO db.kb (title, content) VALUES (?, ?); INSERT INTO db.training (title, description) VALUES (?, ?);"
    },
    {
      time: "09:35:37",
      agent: "GROWTH",
      agentName: isAr ? "أخصائي تطوير المبيعات والتسويق الرقمي" : "Growth & Commercial Agent",
      type: "db_write",
      category: "growth",
      color: "text-emerald-400 font-bold",
      phase: isAr ? "تجديد مؤشرات الأداء والتحسين المستمر والأتمتة" : "Finalizing System Automation",
      desc: isAr
        ? "حقن مؤشرات الكفاءة التشغيلية والتحسين المستمر Kaizen وسيناريوهات التشغيل والتحول التلقائي المتقاطع في قواعد البيانات."
        : "Persisting quantitative KPI targets, Kaizen improvement proposals, and background triggers to support headless workflow orchestration.",
      dbOperation: "INSERT INTO db.kpis (name, target) VALUES (?, ?); INSERT INTO db.automation_rules (name, actions) VALUES (?, ?);"
    },
    {
      time: "09:35:38",
      agent: "SYSTEM",
      agentName: isAr ? "النظام الأساسي" : "SYSTEM RUNTIME",
      type: "commit",
      category: "system",
      color: "text-emerald-400 font-extrabold",
      phase: isAr ? "النشر والاعتماد النهائي" : "Database Synchronized & Committed",
      desc: isAr
        ? "اكتمال المعالجة! تم تأكيد وحفظ كافة الجداول (Commit Transactions) وبناء العلاقات البينية. النظام جاهز للتشغيل الذاتي التام."
        : "Execution transaction package successfully completed by all virtual boardroom agents! All db modules are synchronized online.",
      dbOperation: "COMMIT TRANSACTION; RLS Security Policies applied."
    }
  ];
}
