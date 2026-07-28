<!DOCTYPE html>
<html lang="cs">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bouřkář CZ — Živý radar</title>
    <style>
        body { font-family: sans-serif; background-color: #1a202c; color: white; text-align: center; margin: 0; padding: 20px; }
        header { background-color: #2d3748; padding: 20px; border-radius: 8px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
        h1 { margin: 0; font-size: 24px; }
        .btn { display: inline-block; padding: 10px 20px; color: white; text-decoration: none; border-radius: 5px; font-weight: bold; border: none; cursor: pointer; }
        .btn-fb { background-color: #1877F2; }
        .btn-admin { background-color: #4a5568; }
        .radar-box { background: #2d3748; padding: 20px; border-radius: 8px; margin: 20px auto; max-width: 950px; }
        iframe { width: 100%; height: 650px; border: none; border-radius: 8px; background: white; }
        input { padding: 10px; border-radius: 5px; border: none; margin-right: 10px; }
    </style>
</head>
<body>

    <header>
        <div>
            <h1>⚡ Bouřkář CZ</h1>
            <span style="font-size: 12px; color: #a0aec0;">Radar ČHMÚ · blesky · předpovědi pro Česko</span>
        </div>
        <div>
            <a href="https://facebook.com" target="_blank" class="btn btn-fb">Facebook Bouřkář CZ</a>
            <a href="#admin-sekce" class="btn btn-admin">Admin přihlášení</a>
        </div>
    </header>

    <div class="radar-box">
        <h2>Živý radar srážek a bouřek ČHMÚ</h2>
        <iframe src="https://chmi.cz"></iframe>
    </div>

    <div id="admin-sekce" style="margin-top: 50px; background: #2d3748; padding: 30px; border-radius: 8px; display: inline-block;">
        <h3>Administrace webu</h3>
        <p style="font-size: 14px; color: #a0aec0;">Zadejte heslo pro správu výstrah a galerie</p>
        <input type="password" id="heslo-pole" placeholder="Zadejte heslo admina">
        <button onclick="overitAdmina()" class="btn btn-admin" style="background-color: #3182ce;">Vstoupit</button>
    </div>

    <script>
        function overitAdmina() {
            const zadaneHeslo = document.getElementById('heslo-pole').value;
            if (zadaneHeslo === "kujal880") {
                alert("Správné heslo! Vítejte.");
                // Přesměrujeme na administrativní rozhraní
                window.location.href = "/galerie.html";
            } else {
                alert("Chybné heslo! Přístup odepřen.");
            }
        }
    </script>

</body>
</html>
