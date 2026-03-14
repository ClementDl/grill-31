// Vercel Serverless Function — Chatbot Le Grill 31 (CommonJS)
const https = require('https');

const SYSTEM = `Tu es l'assistant virtuel du restaurant Le Grill 31, situé au 67 Place Carnot, 59500 Douai.
Tu réponds uniquement en français, de manière chaleureuse, concise et professionnelle.
Tu ne réponds qu'aux questions concernant le restaurant. Pour toute autre question, redirige poliment vers le sujet du restaurant.

INFORMATIONS DU RESTAURANT :
- Nom : Le Grill 31
- Slogan : "La grillade se met sur son 31"
- Adresse : 67 Place Carnot, 59500 Douai
- Téléphone : 03 59 43 31 23
- Note Google : 4,8/5 (451 avis)
- Prix moyen : 10–20€ par personne
- Services : Terrasse, Menu enfant disponible
- Viande : 100% HALAL certifiée

HORAIRES :
- Lundi : Fermé
- Mardi–Vendredi : 12h00–14h00 et 19h00–22h00
- Samedi : 12h00–14h30 et 19h00–22h30
- Dimanche : 12h00–15h00

CARTE COMPLÈTE :

ENTRÉES :
- Salade Composée — 8,50€ (carottes râpées, betteraves, concombres, tomates, maïs, olives noires, salade iceberg, thon)
- Mi-Cuit Pistache — 8,50€
- M'hencha — 8,50€ (feuille de pastilla, petits légumes et poulet)
- Soupe du Jour — 5,90€
- Burrata — 8,50€
- Bastella Poulet Amande — 9,90€ (uniquement le week-end)

DESSERTS :
- Tiramisu Spéculoos — 7,50€
- Fondant Chocolat — 7,50€
- Brioche Perdue Fourrée Nutella — 7,50€
- Assiette de Fruits — 7,50€

SANDWICHS (8,90€ chacun) — avec salade, tomates, oignons, carottes râpées, maïs :
- Poulet / Saucisse / Viande Hachée / Merguez

PLATS — tous accompagnés de lentilles à l'orientale et poivrons à la tomate :
- 2 Steaks Végétaux — 14,90€
- 2 Brochettes de Poulet — 15,50€
- 2 Brochettes d'Agneau — 17,90€
- 2 Brochettes de Veau — 17,00€
- 2 Brochettes de Bœuf — 17,90€
- Lasagne de Bœuf — 15,90€
- Merguez — 14,90€
- 3 Côtelettes d'Agneau — 17,90€
- Burger Le 31 — 16,90€
- Kefta — 15,50€
- Saucisses — 14,90€
- Melfouf — 14,90€ (foie d'agneau & crépine)
- Entrecôte de Bœuf classique — 24,90€
- Entrecôte Maturée — 34,90€

MENU ENFANT : brochette poulet OU merguez OU saucisse + frites fraîches + crudités + boisson + compote

BOISSONS :
- Eau plate 50cl — 3,50€ / 1L — 4,90€
- Eau pétillante 50cl — 3,50€ / 1L — 4,90€
- Sodas (Coca, Orangina, Sprite, Oasis, Lipton, Schweppes) — 3,00€
- Jus (orange, pomme, ananas) — 3,00€
- Sirop — 0,50€
- Virgin Mojito (8 parfums) — 6,90€
- Café Expresso — 1,70€ / Allongé — 2,00€ / Au lait — 2,00€
- Cappuccino — 2,50€
- Thé (menthe, infusion) — 2,00€`;

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { message, history = [] } = req.body || {};
  if (!message) return res.status(400).json({ error: 'Message requis' });

  const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim();
  if (!apiKey) return res.status(500).json({ error: 'API key manquante' });

  const messages = [
    ...history.slice(-6),
    { role: 'user', content: message }
  ];

  const body = JSON.stringify({
    model: 'claude-3-haiku-20240307',
    max_tokens: 512,
    system: SYSTEM,
    messages,
  });

  return new Promise((resolve) => {
    const options = {
      hostname: 'api.anthropic.com',
      path: '/v1/messages',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(body),
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    };

    const req2 = https.request(options, (response) => {
      let data = '';
      response.on('data', (chunk) => { data += chunk; });
      response.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          if (parsed.error) {
            console.error('Anthropic error:', parsed.error);
            res.status(500).json({ error: parsed.error.message });
          } else {
            res.status(200).json({ reply: parsed.content[0].text });
          }
        } catch (e) {
          console.error('Parse error:', e, data);
          res.status(500).json({ error: 'Parse error' });
        }
        resolve();
      });
    });

    req2.on('error', (e) => {
      console.error('Request error:', e);
      res.status(500).json({ error: e.message });
      resolve();
    });

    req2.write(body);
    req2.end();
  });
};
