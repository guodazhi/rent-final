<!DOCTYPE html>
<html lang="zh">
<head>
  <meta charset="UTF-8" />
  <title>Submit Listing</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />

  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 500px;
      margin: 60px auto;
    }

    h1 {
      margin-bottom: 30px;
    }

    input, textarea {
      width: 100%;
      padding: 10px;
      margin-bottom: 15px;
      font-size: 16px;
      box-sizing: border-box;
    }

    button {
      padding: 10px 20px;
      font-size: 16px;
      cursor: pointer;
    }

    #message {
      margin-top: 20px;
      font-weight: bold;
    }

    .success {
      color: green;
    }

    .error {
      color: red;
    }
  </style>
</head>
<body>

  <h1>Submit Listing</h1>

  <form id="listingForm">
    <input type="text" id="title" placeholder="Title" required />
    <input type="number" id="price" placeholder="Price" required />
    <input type="text" id="location" placeholder="Location" />
    <input type="text" id="contact" placeholder="Contact" />
    <textarea id="description" placeholder="Description (optional)"></textarea>
    <button type="submit">Submit</button>
  </form>

  <div id="message"></div>

  <script>
    const form = document.getElementById("listingForm");
    const messageDiv = document.getElementById("message");

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      messageDiv.textContent = "Submitting...";
      messageDiv.className = "";

      const data = {
        title: document.getElementById("title").value,
        price: document.getElementById("price").value,
        location: document.getElementById("location").value,
        contact: document.getElementById("contact").value,
        description: document.getElementById("description").value
      };

      try {
        const res = await fetch("/.netlify/functions/submit", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify(data)
        });

        const result = await res.json();

        if (!res.ok) {
          throw new Error(result.error || "Submission failed");
        }

        messageDiv.textContent = "提交成功！等待审核。";
        messageDiv.className = "success";
        form.reset();

      } catch (err) {
        messageDiv.textContent = "错误：" + err.message;
        messageDiv.className = "error";
      }
    });
  </script>

</body>
</html>
