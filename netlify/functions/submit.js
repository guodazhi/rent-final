<!doctype html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>Submit Listing</title>
  <style>
    body {
      font-family: Arial, Helvetica, sans-serif;
      padding: 40px;
      max-width: 520px;
      margin: 0 auto;
    }
    h1 { font-size: 44px; margin: 0 0 20px; }
    label { display:block; margin: 12px 0 6px; color:#333; }
    input, textarea {
      width: 100%;
      box-sizing: border-box;
      padding: 10px;
      border: 1px solid #bbb;
      border-radius: 6px;
      font-size: 16px;
    }
    textarea { min-height: 90px; resize: vertical; }
    button {
      margin-top: 14px;
      padding: 10px 16px;
      font-size: 16px;
      border: 1px solid #888;
      border-radius: 6px;
      background: #f3f3f3;
      cursor: pointer;
    }
    button:disabled {
      opacity: .6;
      cursor: not-allowed;
    }
    #msg {
      margin-top: 12px;
      white-space: pre-wrap;
      font-size: 15px;
    }
    .hint { margin-top:10px; color:#666; font-size: 13px; }
  </style>
</head>
<body>
  <h1>Submit Listing</h1>

  <form id="listingForm">
    <label for="title">Title</label>
    <input id="title" name="title" placeholder="e.g. Master Room" required />

    <label for="price">Price</label>
    <input id="price" name="price" type="number" placeholder="e.g. 800" required />

    <label for="location">Location</label>
    <input id="location" name="location" placeholder="e.g. Brisbane / 西安" required />

    <label for="contact">Contact</label>
    <input id="contact" name="contact" placeholder="e.g. WeChat / Phone" required />

    <label for="description">Description (optional)</label>
    <textarea id="description" name="description" placeholder="简单描述一下房源/要求..."></textarea>

    <button id="submitBtn" type="submit">Submit</button>
  </form>

  <div id="msg"></div>
  <div class="hint">提交后将进入待审核状态，审核通过后会在 Approved Listings 页面显示。</div>

  <script>
    const form = document.getElementById("listingForm");
    const btn = document.getElementById("submitBtn");
    const msgEl = document.getElementById("msg");

    function showMsg(text, ok = true) {
      msgEl.style.color = ok ? "#0b6b2a" : "#b00020";
      msgEl.textContent = text;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // 防重复提交
      btn.disabled = true;
      showMsg("Submitting...", true);

      const payload = {
        title: form.title.value.trim(),
        price: Number(form.price.value),
        location: form.location.value.trim(),
        contact: form.contact.value.trim(),
        description: form.description.value.trim()
      };

      // 基本校验
      if (!payload.title || !payload.location || !payload.contact || !payload.price) {
        showMsg("❌ Please fill in Title/Price/Location/Contact.", false);
        btn.disabled = false;
        return;
      }

      try {
        const res = await fetch("/.netlify/functions/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        let out = null;
        try { out = await res.json(); } catch (_) {}

        if (!res.ok) {
          const errMsg = (out && (out.error || out.message)) ? (out.error || out.message) : ("HTTP " + res.status);
          showMsg("❌ " + errMsg, false);
          btn.disabled = false;
          return;
        }

        showMsg("✅ Submitted! Waiting for approval...", true);
        form.reset();

        // 可选：成功后跳转到 approved 页面
        setTimeout(() => {
          window.location.href = "/approved.html";
        }, 1500);

      } catch (err) {
        showMsg("❌ Network error. Please try again.", false);
      } finally {
        // 如果你不想跳转，也会恢复按钮
        btn.disabled = false;
      }
    });
  </script>
</body>
</html>
