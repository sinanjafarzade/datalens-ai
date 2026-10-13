# Domino

4 nəfərlik (2×2) onlayn domino oyunu. Dostlar linklə qoşulur, qeydiyyat yoxdur.

- Qaydalar: [`docs/QAYDALAR.md`](docs/QAYDALAR.md)

## Struktur

| Qovluq | Nə var |
|---|---|
| `src/engine/` | Qayda mühərriki — qarışdırma, gediş, bağlı, xal, 13 qaydası. UI-dan asılı deyil. |
| `tests/` | Hər qayda üçün avtomatik testlər (sənin nümunələrin daxil). |

## Mərhələlər

- [x] 1. Qayda mühərriki + testlər
- [ ] 2. Server: otaq, link, ad, yer seçmə, 15 saniyəlik taymer
- [ ] 3. Masa interfeysi (React)
- [ ] 4. Pulsuz hostinqə yerləşdirmə

## Əmrlər

```bash
npm install
npm test          # testlər
npm run typecheck # TypeScript yoxlaması
```
