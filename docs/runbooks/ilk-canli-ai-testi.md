# Runbook: ilk canlı AI testi (`POST /api/admin/ai/smoke`)

Plan 10.14 E. Adımlar: [README](../../README.md) → "Dağıtım rehberi" → "8. İlk canlı AI testi".

> Bu dosyaya **yalnızca** aşağıdaki alanları yaz. API anahtarını, anahtarın son karakterlerini,
> istek başlıklarını, çerezleri ya da bağlantı dizelerini **asla** yazma.

## Kontrol listesi

- [ ] Anthropic Console'da projeye özel workspace ve anahtar var; aylık harcama limiti ve uyarılar açık.
- [ ] Vercel'de `ANTHROPIC_API_KEY` yalnızca **Production** ortamında ve **Sensitive**.
- [ ] `AI_LIVE=true` yapıldı → Redeploy.
- [ ] İzin listesindeki hesapla giriş yapıldı, smoke çağrısı yapıldı.
- [ ] `AI_LIVE=false` yapıldı → Redeploy (test bitince hemen).
- [ ] Ertesi gün Console'da kullanım ve maliyet kontrol edildi.

## Kayıtlar

Her deneme için bir satır ekle.

| Tarih (YYYY-AA-GG) | Dağıtım (commit kısa SHA) | `model` | `ok` | `stop_reason` | `latencyMs` | Hata kodu (varsa) | Console'daki maliyet (USD) | Not |
| ------------------ | ------------------------- | ------- | ---- | ------------- | ----------- | ----------------- | -------------------------- | --- |
|                    |                           |         |      |               |             |                   |                            |     |

## Sorun olursa

| Belirti                         | Olası neden ve yapılacak                                                                      |
| ------------------------------- | --------------------------------------------------------------------------------------------- |
| `404`                           | `AI_LIVE` `true` değil ya da redeploy yapılmadı; ya da istek siteden değil (Origin farklı).   |
| `403`                           | Oturumdaki e-posta izin listesinde değil.                                                     |
| `NOT_CONFIGURED`                | `ANTHROPIC_API_KEY` Production ortamında tanımlı değil.                                       |
| `AUTH` / `PERMISSION`           | Anahtar geçersiz ya da iptal edilmiş, ya da workspace izinleri eksik: Console'da kontrol et.  |
| `RATE_LIMITED`                  | Dakikalık sınır ya da harcama limiti: biraz bekle, Console'da limiti kontrol et.              |
| `TIMEOUT` / `CONNECTION`        | Geçici ağ sorunu: birkaç dakika sonra bir kez daha dene.                                      |
| `UPSTREAM`                      | Anthropic tarafında hata: status.anthropic.com'a bak, sonra tekrar dene.                      |
| `REFUSAL` / `UNEXPECTED_OUTPUT` | Model beklenen yanıtı vermedi: tarihi ve kodu buraya not et, geliştirme oturumunda incelenir. |

**Anahtar sızdıysa:** önce Console'da anahtarı hemen iptal et, yenisini oluşturup Vercel'e gir ve
yeniden dağıt (plan 10.14 F).
