import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const workspaceDir = "C:/Users/Lenovo/Desktop/agent";
const SKILL_DIR = "C:/Users/Lenovo/.codex/plugins/cache/openai-primary-runtime/presentations/26.909.12148/skills/presentations";
const RUNTIME_PYTHON = "C:/Users/Lenovo/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/python.exe";
const TMP_DIR = path.join(workspaceDir, "tools/ppt-build/tmp");
const FINAL_PPTX = path.join(workspaceDir, "交付材料/02_银行AI_Agent答辩材料.pptx");
const { finalizePresentation, makeNativeBulletParagraphs } = await import(pathToFileURL(path.join(SKILL_DIR, "container_tools/artifact_tool_utils.mjs")).href);
await fs.mkdir(TMP_DIR, { recursive: true });
await fs.mkdir(path.dirname(FINAL_PPTX), { recursive: true });

const FONT = "Microsoft YaHei";
const C = { ink: "#17212B", green: "#0F5C4E", mint: "#DCECE6", paper: "#F5F4EF", white: "#FFFFFF", muted: "#68736F", orange: "#E39A5D", red: "#B84F47", line: "#D9E1DD" };
const p = Presentation.create({ slideSize: { width: 1280, height: 720 } });

function text(slide, value, x, y, w, h, size=24, color=C.ink, bold=false, align="left") {
  const s = slide.shapes.add({ geometry: "textbox", position: { left:x, top:y, width:w, height:h }, fill:"none", line:{fill:"none",width:0} });
  s.text = value;
  s.text.style = { typeface: FONT, fontSize: size, color, bold, autoFit:"shrinkText", alignment: align, verticalAlignment:"middle", marginLeft:0, marginRight:0, marginTop:0, marginBottom:0 };
  return s;
}
function rect(slide, x, y, w, h, fill, line=fill) {
  return slide.shapes.add({ geometry:"rect", position:{left:x,top:y,width:w,height:h}, fill, line:{fill:line,width:1} });
}
function bulletList(slide, items, x, y, w, h, size=22, color=C.ink) {
  const s = slide.shapes.add({ geometry:"textbox", position:{left:x,top:y,width:w,height:h}, fill:"none", line:{fill:"none",width:0} });
  s.text = makeNativeBulletParagraphs(items, { marginLeftPoints:18, hangingPoints:9, spaceAfterPoints:10 });
  s.text.style = { typeface:FONT, fontSize:size, color, autoFit:"shrinkText", verticalAlignment:"top" };
  return s;
}
function base(title, number) {
  const slide = p.slides.add(); slide.background.fill = C.paper;
  rect(slide, 0, 0, 18, 720, C.green);
  text(slide, title, 70, 42, 1060, 60, 34, C.ink, true);
  text(slide, String(number).padStart(2,"0"), 1160, 52, 60, 34, 16, C.green, true, "right");
  return slide;
}
function note(slide, value) { slide.speakerNotes.textFrame.setText(value); }

{
  const s=p.slides.add(); s.background.fill=C.green;
  text(s,"银行 AI Agent",90,155,1100,90,54,C.white,true);
  text(s,"Web MVP 项目答辩",92,250,700,55,30,"#BFE2D7",false);
  rect(s,92,345,170,5,C.orange);
  text(s,"自然语言交互  受控资金操作  可追溯审计",92,385,900,45,21,C.white,false);
  text(s,"澄心银行演示项目    2026 年 9 月",92,610,700,30,16,"#B7D0C9",false);
  note(s,"本页介绍项目名称和答辩主题。项目只处理模拟数据。" );
}
{
  const s=base("项目定位",2);
  text(s,"用户可以用一句话完成银行任务",75,145,640,55,30,C.green,true);
  bulletList(s,["支持转账、AA 收款、账单分析和订阅管理","覆盖理财、卡片和生日计划等跨场景任务","第一版使用模拟账户，不连接真实银行系统"],75,225,650,260,23);
  rect(s,800,155,340,360,C.white,C.line);
  text(s,"核心边界",845,195,250,35,21,C.green,true,"center");
  text(s,"模型理解用户需求",845,265,250,40,21,C.ink,true,"center");
  text(s,"后端校验和执行",845,345,250,40,21,C.ink,true,"center");
  text(s,"用户确认高风险操作",845,425,250,40,21,C.ink,true,"center");
  note(s,"系统将自然语言理解和资金执行分开。模型不能直接修改余额。" );
}
{
  const s=base("主要功能",3);
  const items=[["01","智能转账","姓名、手机号、语音、定时"],["02","账单分析","分类、异常识别、月度报告"],["03","理财与卡片","风险适配、申购、挂失和限制"],["04","订阅与自动化","续费提醒、取消、生日计划"]];
  items.forEach((it,i)=>{const y=150+i*112;text(s,it[0],82,y,55,50,24,C.orange,true);text(s,it[1],160,y,250,42,24,C.ink,true);text(s,it[2],430,y,650,42,20,C.muted,false);rect(s,160,y+65,920,1,C.line);});
  note(s,"功能按用户任务组织。每类写操作都进入确认流程。" );
}
{
  const s=base("系统架构",4);
  const layers=[["Web 前端","Next.js 15","聊天、看板、确认卡"],["业务 API","NestJS 11","规则、状态机、工具接口"],["AI 服务","DeepSeek","意图识别和解释"],["数据与任务","PostgreSQL  Redis","记录与定时任务"]];
  layers.forEach((it,i)=>{const y=140+i*120;rect(s,95,y,1080,88,i%2?C.white:C.mint,C.line);text(s,it[0],130,y+18,220,48,24,C.green,true);text(s,it[1],390,y+18,260,48,22,C.ink,true);text(s,it[2],700,y+18,420,48,20,C.muted,false);});
  note(s,"架构使用 TypeScript 单仓库。演示模式默认使用内存种子数据，数据库和任务 worker 已保留接口。" );
}
{
  const s=base("资金操作状态机",5);
  const steps=[["1","理解","识别意图与参数"],["2","准备","校验余额与权限"],["3","确认","展示完整确认卡"],["4","认证","校验演示认证码"],["5","执行","幂等扣款与审计"]];
  steps.forEach((it,i)=>{const x=65+i*238;rect(s,x,215,205,220,i===4?C.green:C.white,C.line);text(s,it[0],x+68,238,70,50,32,i===4?C.white:C.orange,true,"center");text(s,it[1],x+30,310,145,40,24,i===4?C.white:C.ink,true,"center");text(s,it[2],x+22,365,160,46,16,i===4?"#DDEDE8":C.muted,false,"center");});
  text(s,"确认前不扣款  重复执行不重复扣款  过期操作不能执行",150,505,980,42,22,C.green,true,"center");
  note(s,"所有资金和高风险动作使用统一状态机。operationId 用于追踪，idempotencyKey 防止重复执行。" );
}
{
  const s=base("五条演示链路",6);
  bulletList(s,["语音或文字发起转账，重名联系人先消歧","设置明日或指定日期的定时转账","输入聚餐金额与参与人，生成 AA 收款请求","查看本月异常交易及规则信号解释","识别爱人生日，预留资金并单独确认礼物订单"],95,150,1060,400,25);
  text(s,"演示认证码  123456",95,575,1060,42,23,C.orange,true,"center");
  note(s,"演示时建议选择李梅手机号转账，避免张三重名流程占用时间。" );
}
{
  const s=base("验证结果",7);
  const metrics=[["6 / 6","API 单元测试"],["3 个","应用通过类型检查"],["500 元","冒烟测试余额差额"],["3 条","单笔转账审计事件"]];
  metrics.forEach((m,i)=>{const x=70+i*295;rect(s,x,165,255,185,C.white,C.line);text(s,m[0],x+20,205,215,55,34,C.green,true,"center");text(s,m[1],x+20,275,215,40,18,C.muted,false,"center");});
  text(s,"01  Next.js、NestJS 和 worker 生产构建通过",120,405,1000,38,19,C.ink,false);
  text(s,"02  敏感信息检测和提示词注入拦截已纳入测试",120,458,1000,38,19,C.ink,false);
  text(s,"03  DeepSeek 不可用时自动回退本地安全解析器",120,511,1000,38,19,C.ink,false);
  note(s,"测试结果来自当前工作区实际执行记录。" );
}
{
  const s=base("当前边界与后续工作",8);
  text(s,"当前边界",90,145,470,45,27,C.red,true);
  bulletList(s,["不连接真实银行、证券、征信或商户","固定演示认证码不适用于生产环境","默认数据存储在进程内存中"],90,215,470,210,21);
  text(s,"下一阶段",690,145,470,45,27,C.green,true);
  bulletList(s,["接入真实身份认证和银行授权服务","启用 PostgreSQL 事务与 Redis 任务队列","完成依赖扫描、渗透测试和合规评审"],690,215,470,210,21);
  text(s,"项目源码、技术文档和安全自评报告随材料包交付",90,565,1070,40,20,C.muted,false,"center");
  note(s,"结尾明确演示边界，避免把 MVP 描述为可直接上线的银行系统。" );
}

const stagingDir = path.join(workspaceDir, ".codex-finalizer");
await fs.mkdir(stagingDir,{recursive:true});
const candidatePath=path.join(stagingDir,"bank-agent-candidate.pptx");
await (await PresentationFile.exportPptx(p)).save(candidatePath);
const requirements={explicitTotalSlideCount:8,requiredNativeTableOwnerSlides:[],requiredNativeChartOwnerSlides:[]};
const result=await finalizePresentation({
  ...requirements, workspaceDir, candidatePath, finalPath:FINAL_PPTX,
  pythonExecutable:RUNTIME_PYTHON,
  integrityValidatorPath:path.join(SKILL_DIR,"container_tools/inspect_presentation_package_integrity.py"),
  layoutValidatorPath:path.join(SKILL_DIR,"container_tools/inspect_presentation_layout_geometry.py"),
  layoutArgs:["--expected-slide-size-emu","12192000,6858000","--validate-bullet-geometry","--validate-heading-fit"],
  fontPolicy:{basis:"design",families:[FONT]}, verifyArtifactToolImport:true,
  receiptPath:path.join(stagingDir,"bank-agent-pptx-v2.validation.json")
});
console.log(JSON.stringify(result,null,2));
