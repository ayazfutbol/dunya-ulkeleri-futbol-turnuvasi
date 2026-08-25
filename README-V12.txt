V12 - Yetkilendirilebilir yöneticiler

Sahip hesap: ayazakcay599@gmail.com

Yenilik:
- Yönetim panelindeki kullanıcı listesinde sahip için "Yönetici Yetkisi Ver / Yönetici Yetkisini Kaldır" bulunur.
- Sahip tarafından yetkilendirilen e-postalar yönetim paneline girebilir.
- Yetkilendirilmiş yöneticiler bakım, tema/logo, kullanıcı engelleme, takım güçleri ve tam oyun kodu yayınlama işlemlerini yapabilir.
- Yeni yönetici ekleme/kaldırma yetkisi yalnızca sahip hesaptadır.
- Sahip hesabın yönetici yetkisi kaldırılamaz.
- Firestore kuralları da aynı adminEmails listesini kontrol eder; yalnızca butonu gizlemekle yetinilmez.

Kurulum:
1. index.html ve diğer dosyaları kullan.
2. Firestore > Rules bölümüne bu klasördeki firestore.rules dosyasını Publish et.
3. Önce sahip hesapla giriş yap.
4. Yönetim Paneli > Kullanıcılar bölümünden istediğin kullanıcıya "Yönetici Yetkisi Ver" de.
