// ===== APIキー管理 =====
const apiKeyInput = document.getElementById('apiKey');
const saveKeyBtn = document.getElementById('saveKey');
const keyStatus = document.getElementById('keyStatus');

if (localStorage.getItem('anthropic_key')) {
  apiKeyInput.value = localStorage.getItem('anthropic_key');
  keyStatus.textContent = '✓ 保存済み';
}

saveKeyBtn.addEventListener('click', () => {
  const key = apiKeyInput.value.trim();
  if (!key) return;
  localStorage.setItem('anthropic_key', key);
  keyStatus.textContent = '✓ 保存しました';
  setTimeout(() => keyStatus.textContent = '✓ 保存済み', 2000);
});

function getApiKey() {
  return localStorage.getItem('anthropic_key') || apiKeyInput.value.trim();
}

// ===== ステップナビ =====
document.querySelectorAll('.step-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.step-btn').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    document.getElementById('panel-' + btn.dataset.step).classList.add('active');
  });
});

// ===== Claude API呼び出し =====
async function callClaude(systemPrompt, userMessage) {
  const key = getApiKey();
  if (!key) { alert('APIキーを入力・保存してください'); return null; }
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }]
    })
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'APIエラー');
  }
  const data = await res.json();
  return data.content[0].text;
}

// ===== 結果表示 =====
function showResult(el, text) {
  el.classList.add('visible');
  el.innerHTML = '';
  const copyBtn = document.createElement('button');
  copyBtn.className = 'copy-btn';
  copyBtn.textContent = 'コピー';
  copyBtn.addEventListener('click', () => {
    navigator.clipboard.writeText(text);
    copyBtn.textContent = 'コピーしました！';
    setTimeout(() => copyBtn.textContent = 'コピー', 2000);
  });
  el.appendChild(copyBtn);
  const content = document.createElement('div');
  content.style.marginTop = '8px';
  content.textContent = text;
  el.appendChild(content);
}

function showLoading(el, msg = '生成中') {
  el.classList.add('visible');
  el.innerHTML = `<div class="loading">${msg}<div class="loading-dots"><span></span><span></span><span></span></div></div>`;
}

// ===== ブランドシステムプロンプト =====
const BRAND_SYSTEM = `
あなたはInstagramコンテンツ戦略の専門家です。
クライアントは「たおやか麹lab」を運営する麹講師・なおみ（@naomi_taoyaka_koji）です。

【ブランド概要】
- ターゲット：ゆらぎ世代（40〜55歳）の忙しい女性
- 強み：黄・黒・白の3種の麹菌を使いこなす専門性
- 麹調味料ラインナップ（9種）：
  基本系：濃縮甘酒、塩麹、醤油麹
  だし系：ベジブイヨン麹、白だし麹、めんつゆ麹
  スパイス系：カレー麹、にんにく麹、生姜麹
- 特記：黒麹を加熱すると動物性脂肪なしでバター様のコクが出る
- 撮影ルール：映すのは手元・食材・器・完成品のみ（顔・体は映さない）
- 発信内容ルール：体重・体型・ビフォーアフターは掲載しない

【バズった台本の参考構成：白だし麹（約36秒・17万再生）】
- 冒頭1秒：「正直これを知ってから市販の〇〇買わなくなりました」形式の強い否定フック
- 完成品のとろみ・色・質感を冒頭とエンディングの両方に入れるループ構造
- テロップはナレーションを3〜5文字で分割して畳み掛けるリズム感
- 工程の中に「プロだけが知るコツ」を1行で言い切るシーンを入れる
- 撮影は手元・食材・器・完成品のみ
- CTA：「詳しい作り方はキャプションへ／作ってみてね」

【Jenny Hoyos流の必須ルール】
- 冒頭1秒で結論または強い問いかけを入れる
- 「なぜ最後まで見るべきか」を冒頭3秒以内に約束する
- 完成品を最初と最後に見せてループさせる
- 視聴者が離脱しそうなタイミングに「実はここがポイント」を挟む

【台本生成の最低限ルール】
- 冒頭に必ず「麹」という言葉を入れる
- レシピが提供された場合は必ずそのレシピに忠実に生成する
- レシピにない工程や材料は勝手に追加しない
- ナレーション台本は短文・体言止め・改行多めで話しやすく
`.trim();

// ===== STEP 1: リサーチ =====
document.getElementById('runResearch').addEventListener('click', async () => {
  const keyword = document.getElementById('researchKeyword').value.trim();
  const season = document.getElementById('researchSeason').value.trim();
  const resultEl = document.getElementById('researchResult');
  if (!keyword) { alert('キーワードを入力してください'); return; }
  const btn = document.getElementById('runResearch');
  btn.disabled = true;
  showLoading(resultEl, 'リサーチ中');
  try {
    const userMsg = `
【リサーチ依頼】
キーワード：${keyword}
季節・時期：${season || '現在'}

以下の観点で調査・分析してください：

1. トレンドキーワード（5〜8個）
2. 競合動向（このテーマで伸びているコンテンツの傾向・差別化ポイント）
3. 季節ネタ・旬の切り口（3〜5個）
4. 今週の企画推奨テーマ（TOP3）

出力は日本語で、実用的に使えるよう具体的に書いてください。
`.trim();
    const result = await callClaude(BRAND_SYSTEM, userMsg);
    showResult(resultEl, result);
  } catch (e) {
    resultEl.classList.add('visible');
    resultEl.innerHTML = `<span style="color:red">エラー：${e.message}</span>`;
  } finally {
    btn.disabled = false;
  }
});

// ===== STEP 2: 企画・台本 + チャット =====
let chatHistory = [];

document.getElementById('runPlan').addEventListener('click', async () => {
  const theme = document.getElementById('planTheme').value.trim();
  const goal = document.getElementById('planGoal').value;
  const recipe = document.getElementById('planRecipe').value.trim();
  const researchRef = document.getElementById('planResearchRef').value.trim();
  const resultEl = document.getElementById('planResult');
  const scriptChat = document.getElementById('scriptChat');
  const chatMessages = document.getElementById('chatMessages');
  if (!theme) { alert('テーマを入力してください'); return; }
  const btn = document.getElementById('runPlan');
  btn.disabled = true;
  scriptChat.style.display = 'none';
  showLoading(resultEl, '台本生成中');
  const userMsg = `
【企画・台本生成依頼】
テーマ・麹の種類：${theme}
投稿目的：${goal}
${recipe ? `\nレシピ：\n${recipe}` : ''}
${researchRef ? `\nリサーチ参考情報：\n${researchRef}` : ''}

以下を生成してください：

■ 投稿企画案（3本）
各案につき：タイトル / フック / 構成の軸 / ターゲット感情

■ 推奨No.1の30秒リール台本
セリフ（ナレーション）とテロップ、映像指示を含めて
${recipe ? '※上記レシピの内容に必ず忠実に生成すること' : ''}
`.trim();
  try {
    const result = await callClaude(BRAND_SYSTEM, userMsg);
    chatHistory = [
      { role: 'user', content: userMsg },
      { role: 'assistant', content: result }
    ];
    chatMessages.innerHTML = '';
    addChatMsg('assistant', result);
    scriptChat.style.display = 'block';
    resultEl.classList.remove('visible');
    resultEl.innerHTML = '';
  } catch (e) {
    resultEl.classList.add('visible');
    resultEl.innerHTML = `<span style="color:red">エラー：${e.message}</span>`;
  } finally {
    btn.disabled = false;
  }
});

document.getElementById('chatSend').addEventListener('click', sendChat);
document.getElementById('chatInput').addEventListener('keydown', e => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
});

async function sendChat() {
  const input = document.getElementById('chatInput');
  const msg = input.value.trim();
  if (!msg) return;
  const chatMessages = document.getElementById('chatMessages');
  addChatMsg('user', msg);
  input.value = '';
  chatHistory.push({ role: 'user', content: msg });
  const loadingMsg = document.createElement('div');
  loadingMsg.className = 'chat-msg assistant';
  loadingMsg.innerHTML = '<div class="loading-dots"><span></span><span></span><span></span></div>';
  chatMessages.appendChild(loadingMsg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  try {
    const key = getApiKey();
    if (!key) { alert('APIキーを入力してください'); return; }
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1000,
        system: BRAND_SYSTEM,
        messages: chatHistory
      })
    });
    const data = await res.json();
    const reply = data.content[0].text;
    chatHistory.push({ role: 'assistant', content: reply });
    loadingMsg.remove();
    addChatMsg('assistant', reply);
  } catch (e) {
    loadingMsg.remove();
    addChatMsg('assistant', `エラー：${e.message}`);
  }
}

function addChatMsg(role, text) {
  const chatMessages = document.getElementById('chatMessages');
  const div = document.createElement('div');
  div.className = `chat-msg ${role}`;
  div.textContent = text;
  chatMessages.appendChild(div);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// ===== STEP 3: スケジュール =====
document.getElementById('runSchedule').addEventListener('click', async () => {
  const freq = document.getElementById('scheduleFreq').value;
  const plan = document.getElementById('schedulePlan').value.trim();
  const resultEl = document.getElementById('scheduleResult');
  const btn = document.getElementById('runSchedule');
  btn.disabled = true;
  showLoading(resultEl, 'カレンダー生成中');
  try {
    const userMsg = `
【スケジュール生成依頼】
投稿頻度：${freq}
${plan ? `\n企画案：\n${plan}` : '企画案未入力のため、麹調味料の一般的な投稿計画を作成してください'}

■ 月間投稿カレンダー（4週分）
- 各週の投稿日（曜日）と推奨時間帯
- 投稿テーマ・内容
- 投稿種別（リール / ストーリー / カルーセル）

■ 投稿のコツ（ゆらぎ世代女性が見ている時間帯の考察含む）
`.trim();
    const result = await callClaude(BRAND_SYSTEM, userMsg);
    showResult(resultEl, result);
  } catch (e) {
    resultEl.classList.add('visible');
    resultEl.innerHTML = `<span style="color:red">エラー：${e.message}</span>`;
  } finally {
    btn.disabled = false;
  }
});

// ===== STEP 4: エンゲージメント =====
document.getElementById('runEngagement').addEventListener('click', async () => {
  const msg = document.getElementById('engagementMsg').value.trim();
  const resultEl = document.getElementById('engagementResult');
  if (!msg) { alert('コメント・DMを入力してください'); return; }
  const btn = document.getElementById('runEngagement');
  btn.disabled = true;
  showLoading(resultEl, '返信文案生成中');
  try {
    const userMsg = `
【返信文案生成依頼】
受け取ったコメント・DM：「${msg}」

以下の3パターンで返信文案を作成してください：

【パターン1：温かみ重視】ゆらぎ世代のお姉さん的な温かみと共感を前面に出した返信
【パターン2：専門性重視】麹講師としての専門知識を活かした信頼感のある返信
【パターン3：親しみやすさ重視】軽やかで親近感のある返信

各パターン：返信文（絵文字含め自然な文体）＋使う場面のアドバイス
`.trim();
    const result = await callClaude(BRAND_SYSTEM, userMsg);
    showResult(resultEl, result);
  } catch (e) {
    resultEl.classList.add('visible');
    resultEl.innerHTML = `<span style="color:red">エラー：${e.message}</span>`;
  } finally {
    btn.disabled = false;
  }
});
