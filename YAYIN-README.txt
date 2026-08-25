DÜNYA ÜLKELERİ FUTBOL TURNUVASI - ÜCRETSİZ GÜNCEL SÜRÜM

DOSYALAR
1) index.html              -> TEK HTML DOSYASI. Yönetim Paneli bunun içindedir.
2) firebase-config.js      -> Firebase Authentication + Firestore bağlantısı.
3) firestore.rules         -> Firestore güvenlik kuralları.
4) storage.rules           -> Storage kullanılmadığı için kapalı kurallar.

ÖNEMLİ
- admin.html YOKTUR.
- Firebase Storage kullanılmaz; bu nedenle ücretli Storage/Blaze planına ihtiyaç duymaz.
- Yönetim Paneli index.html içindedir.
- Yönetici hesabı: ayazakcay599@gmail.com
- Google giriş için Firebase > Authentication > Sign-in method > Google açık olmalı.
- Firebase > Authentication > Settings > Authorized domains içine ayazfutbol.github.io ekli olmalı.
- firebase-config.js içindeki API_KEY, SENDER_ID ve APP_ID alanlarını kendi Firebase Web App bilgilerinizle doldurun.
- Eğer GitHub deposundaki mevcut firebase-config.js zaten gerçek bilgiler içeriyorsa onu koruyun; yeni index.html ile birlikte kullanın.

YAYIN
GitHub reposunda eski index.html dosyasının yerine bu index.html dosyasını yükleyin.
Ardından Actions > pages build and deployment işleminin yeşil tik olmasını bekleyin.

ŞAMPİYONLUK DÜZELTMESİ
Şampiyonluk ekranı artık Firebase kaydı başarısız olsa bile açılır. Kayıt başarısız olursa kullanıcı oyundan atılmaz ve uyarı yerine küçük bildirim gösterilir.

ÜCRETSİZ PLAN
Site GitHub Pages + Firebase Authentication + Firestore ile çalışır. Firebase Storage ve Cloud Functions kullanılmaz.
