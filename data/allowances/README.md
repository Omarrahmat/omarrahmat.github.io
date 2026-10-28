# Council allowance records

One JSON file per council, written by the allowances desk from the council's own published fostering allowance page.
Only figures that the council itself publishes, copied exactly, with the page's URL. Never estimate, never carry a
figure over from last year, never take a figure from a third-party site. `npm run merge:allowances` validates every file
and writes src/data/council-allowances.json; rejected files are listed in data/allowances-report.json.

```json
{
  "slug": "kent",
  "council": "Kent County Council",
  "nation": "England",
  "year": "2026-27",
  "retrievedOn": "2026-10-29",
  "sourceUrl": "https://www.kent.gov.uk/...",
  "sourceTitle": "Fostering allowances and fees (Kent County Council)",
  "allowances": [
    { "label": "0 to 4 years", "weekly": 187.0 },
    { "label": "5 to 10 years", "weekly": 206.0, "note": "optional short note" }
  ],
  "fees": [
    { "label": "Level 1 (newly approved)", "weekly": 110.0 }
  ],
  "feesNote": "Optional: one sentence on how the fee levels work, in our own words.",
  "extras": ["Birthday, religious festival and holiday payments equal to one week's allowance each"],
  "summary": "Two or three sentences in our own words: what the scale covers, whether a fee is paid on top, and anything a prospective carer should know.",
  "areaNames": ["Kent"]
}
```

- `allowances` is the weekly maintenance allowance per child (the money for the child's costs) by age band, as the council labels the bands.
- `fees` is any weekly fee, reward or skills payment paid to the carer on top, by level, if the council publishes one. Leave it out if not.
- `areaNames` are the names used in the directory (a provider's areasServed or town) so the page can link to "Fostering agencies in <area>".
- File name: `<slug>.json`.
