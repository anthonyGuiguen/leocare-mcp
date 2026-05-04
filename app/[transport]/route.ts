import { createMcpHandler } from "mcp-handler";
import { z } from "zod";
import { simulateTarif } from "@/lib/coherent";
import { lookupVehicleByPlate, parseRegistrationDate } from "@/lib/vehicles";
import { ACCROCHE, EXCLUDED_TEMPLATE, FORMULES, INELIGIBLE_TEMPLATE, OUTPUT_TEMPLATE, QUESTIONS, VEHICLE_NOT_FOUND_TEMPLATE } from "@/lib/prompts";

const WIDGET_URI = "ui://leocare/quote.html";

function buildWidgetHtml(): string {
  const ICON_SVG = `<svg width="36" height="36" viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#lci)"><rect width="60" height="60" fill="#6F43D5"/></g><path fill-rule="evenodd" clip-rule="evenodd" d="M45.1533 39.5781C42.8933 40.2901 40.2463 40.7311 38.2453 40.7311C31.9343 40.7311 27.5273 36.4021 27.5273 30.2031C27.5273 23.9521 31.9263 19.7521 38.4733 19.7521C40.5383 19.7521 43.0353 20.1481 44.8353 20.7611L45.7303 21.0661L44.9703 25.2451L43.8303 24.9541C41.9243 24.4681 40.0273 24.1901 38.6263 24.1901C34.8103 24.1901 32.3453 26.5651 32.3453 30.2411C32.3453 33.8941 34.6913 36.2561 38.3213 36.2561C39.6693 36.2561 41.8933 35.8901 44.1263 35.3031L45.2603 35.0041L46.0873 39.2841L45.1533 39.5781ZM27.0003 13.0001L20.6613 37.0091C20.2263 37.0511 19.8303 37.0731 19.4883 37.0731C18.8223 37.0731 18.1993 36.9961 17.6223 36.8491C17.3883 36.7911 17.1593 36.7161 16.9463 36.6031C15.5503 35.8681 15.0003 33.5281 15.0003 31.0001V13.0001H10.0003V31.0001C10.0003 36.2921 12.2643 40.7151 16.3933 41.7471C17.3173 41.9621 18.3043 42.0551 19.3353 42.0591L17.3153 49.7541L50.0003 44.0001V13.0001H27.0003Z" fill="white"/><defs><clipPath id="lci"><rect width="60" height="60" fill="white"/></clipPath></defs></svg>`;
  const ICON_BIRTHDAY = `<svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M7 3.81818C7.3352 3.81818 7.65668 3.68409 7.8937 3.44541C8.13073 3.20673 8.26389 2.883 8.26389 2.54545C8.26389 2.30364 8.20069 2.08091 8.08062 1.89L7 0L5.91937 1.89C5.79931 2.08091 5.73611 2.30364 5.73611 2.54545C5.73611 3.24545 6.30486 3.81818 7 3.81818ZM10.7917 5.72727H7.63194V4.45455H6.36806V5.72727H3.20833C2.15931 5.72727 1.3125 6.58 1.3125 7.63636V13.3636C1.3125 13.7136 1.59687 14 1.94444 14H12.0556C12.4031 14 12.6875 13.7136 12.6875 13.3636V7.63636C12.6875 6.58 11.8407 5.72727 10.7917 5.72727ZM11.4236 12.7273H2.57639V10.8182C3.14514 10.8182 3.68861 10.5827 4.09306 10.1818L4.78819 9.49454L5.45806 10.1818C6.2859 11.0091 7.72674 11.0027 8.54826 10.1818L9.23076 9.49454L9.90694 10.1818C10.3114 10.5827 10.8549 10.8182 11.4236 10.8182V12.7273ZM11.4236 9.86364C11.1076 9.86364 10.7917 9.73636 10.5705 9.50091L9.21181 8.14545L7.87208 9.50091C7.40444 9.97182 6.58924 9.97182 6.1216 9.50091L4.78819 8.14545L3.42319 9.50091C3.20833 9.73 2.89236 9.86364 2.57639 9.86364V7.63636C2.57639 7.28636 2.86076 7 3.20833 7H10.7917C11.1392 7 11.4236 7.28636 11.4236 7.63636V9.86364Z" fill="#58627C"/></svg>`;
  const ICON_CAR = `<svg width="14" height="14" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg"><g clip-path="url(#clip0_1886_79)"><path d="M22.3876 15.6336C21.7813 15.6339 21.1996 15.8755 20.7707 16.3053C20.3417 16.735 20.1005 17.3176 20.1002 17.925C20.0999 18.5325 20.3404 19.1149 20.769 19.5441C21.1975 19.9734 21.7789 20.2144 22.3852 20.2141C22.9915 20.2137 23.5732 19.9721 24.0021 19.5424C24.4311 19.1127 24.6723 18.53 24.6726 17.9226C24.6729 17.3152 24.4323 16.7328 24.0038 16.3035C23.5753 15.8743 22.9939 15.6333 22.3876 15.6336Z" fill="#58627C"/><path d="M9.77386 15.6403C9.16753 15.6406 8.5859 15.8822 8.15693 16.3119C7.72795 16.7416 7.48678 17.3243 7.48646 17.9317C7.48614 18.5391 7.72671 19.1215 8.15523 19.5508C8.58375 19.98 9.16512 20.221 9.77146 20.2207C10.3778 20.2204 10.9594 19.9788 11.3884 19.5491C11.8174 19.1193 12.0585 18.5367 12.0589 17.9293C12.0592 17.3219 11.8186 16.7395 11.3901 16.3102C10.9616 15.8809 10.3802 15.6399 9.77386 15.6403Z" fill="#58627C"/><path fill-rule="evenodd" clip-rule="evenodd" d="M9.7706 1.95143L22.5609 1.94469C23.6567 1.94399 24.721 2.31027 25.5846 2.98532C26.4481 3.66036 27.0612 4.60543 27.3266 5.67029L28.1017 8.78619L29.2236 8.7856C29.6906 8.78535 30.1383 8.97093 30.4683 9.30152C30.7983 9.63211 30.9836 10.0806 30.9833 10.5484C30.9831 11.0162 30.7974 11.4649 30.467 11.7958C30.1823 12.0811 29.8102 12.2587 29.4139 12.3024C30.3883 13.3649 30.9811 14.7832 30.9803 16.3398L30.975 26.3432C30.9746 27.2299 30.6225 28.0804 29.9963 28.7077C29.3701 29.335 28.521 29.6877 27.6359 29.6882C26.7508 29.6886 25.9021 29.3369 25.2766 28.7102C24.651 28.0836 24.2999 27.2334 24.3003 26.3467L24.3008 25.478L7.85031 25.4867L7.84985 26.3554C7.84962 26.7944 7.76307 27.2292 7.59514 27.6349C7.42721 28.0406 7.18118 28.4093 6.87112 28.7199C6.56105 29.0305 6.19302 29.277 5.78803 29.4452C5.38303 29.6134 4.94901 29.7001 4.51075 29.7004C4.07248 29.7006 3.63856 29.6144 3.23374 29.4466C2.82892 29.2788 2.46115 29.0327 2.15141 28.7224C1.84167 28.4121 1.59604 28.0437 1.42853 27.6382C1.26103 27.2326 1.17493 26.798 1.17516 26.3589L1.18042 16.3556C1.17997 15.5415 1.34605 14.7357 1.66843 13.9881C1.93357 13.3731 2.29981 12.8082 2.75095 12.3165C2.35473 12.2731 1.9829 12.0959 1.69849 11.811C1.36848 11.4804 1.18322 11.0319 1.18347 10.5641C1.18371 10.0963 1.36945 9.64761 1.6998 9.31668C2.03016 8.98574 2.47808 8.79969 2.94502 8.79944L4.40692 8.79867L4.93741 5.96876C5.14942 4.84007 5.74859 3.82065 6.6312 3.08704C7.5138 2.35344 8.62435 1.95173 9.7706 1.95143ZM9.7687 5.47888C9.44384 5.47915 9.12917 5.59316 8.87914 5.80119C8.62909 6.00923 8.45942 6.29821 8.39948 6.61812L7.69413 10.3764L24.8444 10.3674C24.8466 10.3474 24.849 10.3275 24.8519 10.3077L23.9084 6.52816C23.8333 6.22656 23.6596 5.95878 23.4152 5.76748C23.1707 5.57617 22.8693 5.47222 22.5589 5.47215L9.7687 5.47888ZM7.14692 13.9042C5.7979 13.9049 4.70239 15.0023 4.70168 16.3537L4.69873 21.9609L27.4561 21.9489L27.459 16.3417C27.4597 14.9903 26.3654 13.894 25.0164 13.8948L7.14692 13.9042Z" fill="#58627C"/></g><defs><clipPath id="clip0_1886_79"><rect width="32" height="32" fill="white"/></clipPath></defs></svg>`;

  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Paytone+One&display=swap" rel="stylesheet">
<link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap" rel="stylesheet">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{height:100%}
  html{background:#6F43D6}
  body{font-family:'Satoshi',sans-serif;background:linear-gradient(160deg,#6F43D6 0%,#8B6BE0 100%);display:flex;flex-direction:column;align-items:center;padding:28px 16px 32px;min-height:100vh;width:100%}
  .tagline{font-family:'Paytone One',sans-serif;font-size:20px;color:#fff;text-align:center;margin-top:15px;margin-bottom:12px;max-width:400px;width:100%;padding:0 8px}
  .card{background:#fff;border-radius:24px;padding:20px;width:100%;max-width:400px;color:#2E374D;box-shadow:0 8px 32px rgba(0,0,0,.18);margin-bottom:15px}
  .card-header{position:relative;display:flex;align-items:center;justify-content:center;margin-bottom:18px}
  .card-icon{position:absolute;left:0;width:40px;height:40px;border-radius:50%;overflow:hidden;padding:2px;background:#6F43D5}
  .card-title{font-family:'Paytone One',sans-serif;font-size:24px;color:#2E374D;text-align:center}
  .price-block{text-align:center;padding-bottom:8px;margin-bottom:8px}
  .price-main{font-family:'Satoshi',sans-serif;font-size:20px;font-weight:900;color:#6F43D6;line-height:1}
  .price-main .unit{font-family:'Satoshi',sans-serif;font-size:16px;font-weight:500;color:#2E374D;margin-left:2px}
  .price-annual{font-family:'Satoshi',sans-serif;font-size:12px;font-weight:500;color:#58627C;margin-top:8px}
  .recap-title{font-family:'Satoshi',sans-serif;font-size:18px;font-weight:900;color:#2E374D;margin-bottom:8px}
  .recap-subcard{border:1px solid #E8E8EF;border-radius:16px;padding:0 16px;margin-bottom:24px}
  .recap-row{display:flex;align-items:flex-start;gap:14px;padding:14px 0;border-bottom:1px solid #F0F0F5}
  .recap-row:last-child{border-bottom:none}
  .recap-icon{flex-shrink:0;width:20px;display:flex;align-items:center;justify-content:center;padding-top:2px}
  .recap-row-label{font-family:'Satoshi',sans-serif;font-size:14px;font-weight:900;color:#58627C;margin-bottom:2px}
  .recap-row-value{font-family:'Satoshi',sans-serif;font-size:16px;font-weight:500;color:#2E374D}
  .cta{display:block;background:#6F43D6;color:#fff;text-align:center;border-radius:50px;padding:16px;font-family:'Satoshi',sans-serif;font-weight:700;font-size:16px;text-decoration:none;transition:opacity .15s}
  .cta:hover{opacity:.88}
  .legal{font-family:'Satoshi',sans-serif;font-size:10px;color:#58627C;margin-top:14px;line-height:1.6;text-align:center}
  .legal a{color:#6F43D6;text-decoration:underline}
  /* Skeleton */
  @keyframes shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}
  .sk{background:linear-gradient(90deg,#F0F0F5 25%,#E4E4EC 50%,#F0F0F5 75%);background-size:800px 100%;animation:shimmer 1.5s infinite linear;border-radius:6px}
  .sk-circle{width:40px;height:40px;border-radius:50%}
  .sk-title{height:24px;width:55%}
  .sk-price{height:28px;width:50%}
  .sk-annual{height:14px;width:65%}
  .sk-section{height:20px;width:35%}
  .sk-icon{width:14px;height:14px}
  .sk-label{height:12px;width:55%}
  .sk-value{height:16px;width:40%}
  .sk-cta{height:52px;width:100%;border-radius:50px}
</style>
</head>
<body>
  <div class="tagline">Votre estimation Leocare</div>
<div class="card">
  <div id="loading">
    <div style="display:flex;flex-direction:column;align-items:center;padding:12px 0 8px;gap:20px">
      <div style="display:flex;align-items:center;gap:12px;width:100%"><div class="sk sk-circle"></div><div class="sk sk-title"></div></div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:8px;width:100%"><div class="sk sk-price"></div><div class="sk sk-annual"></div></div>
      <div class="sk sk-section" style="align-self:flex-start"></div>
      <div style="border:1px solid #E8E8EF;border-radius:16px;padding:0 16px;width:100%">
        <div style="display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid #F0F0F5"><div class="sk sk-icon"></div><div style="display:flex;flex-direction:column;gap:6px;flex:1"><div class="sk sk-label"></div><div class="sk sk-value"></div></div></div>
        <div style="display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid #F0F0F5"><div class="sk sk-icon"></div><div style="display:flex;flex-direction:column;gap:6px;flex:1"><div class="sk sk-label"></div><div class="sk sk-value"></div></div></div>
        <div style="display:flex;align-items:center;gap:14px;padding:14px 0"><div class="sk sk-icon"></div><div style="display:flex;flex-direction:column;gap:6px;flex:1"><div class="sk sk-label"></div><div class="sk sk-value"></div></div></div>
      </div>
      <div class="sk sk-cta"></div>
    </div>
  </div>
  <div id="content" style="display:none">

    <div class="card-header">
      <div class="card-icon">${ICON_SVG}</div>
      <div class="card-title" id="h-formule"></div>
    </div>

    <div class="price-block">
      <div class="price-main"><span class="unit">À partir de</span> <span id="monthly"></span> €<span class="unit">/mois*</span></div>
      <div class="price-annual">Payez annuellement, <span id="annual"></span> €*</div>
    </div>

    <div class="recap-title">Ton profil</div>
    <div class="recap-subcard">
      <div class="recap-row">
        <div class="recap-icon">${ICON_BIRTHDAY}</div>
        <div><div class="recap-row-label">Date de naissance</div><div class="recap-row-value" id="r-naissance"></div></div>
      </div>
      <div class="recap-row">
        <div class="recap-icon">${ICON_CAR}</div>
        <div><div class="recap-row-label">Véhicule</div><div class="recap-row-value" id="r-vehicle"></div></div>
      </div>
      <div class="recap-row">
        <div class="recap-icon">${ICON_BIRTHDAY}</div>
        <div><div class="recap-row-label">Date de naissance</div><div class="recap-row-value" id="r-naissance"></div></div>
      </div>
      <div class="recap-row">
        <div class="recap-icon">${ICON_BIRTHDAY}</div>
        <div><div class="recap-row-label">Permis obtenu le</div><div class="recap-row-value" id="r-permis"></div></div>
      </div>
    </div>

    <a id="cta" class="cta" href="https://app.leocare.eu/fr/devis-assurance-en-ligne/choix-type-assurance" target="_blank" rel="noopener noreferrer">Obtenir mon devis précis</a>
    <div class="legal">*Cette estimation est indicative, avec des compléments générés par IA. Pour un tarif précis et personnalisé, merci de réaliser un devis sur <a href="https://leocare.eu" target="_blank" rel="noopener noreferrer">leocare.eu</a>.</div>

  </div>
</div>
<script>
var shown=false;
function fmt(iso){if(!iso)return'—';var p=iso.split('-');return p.length!==3?iso:p[2]+'/'+p[1]+'/'+p[0];}
function show(d,input){
  if(shown)return;
  if(!d||d.prix_annuel===undefined)return;
  shown=true;
  document.getElementById('tagline-formule').textContent=d.formule||'';
  document.getElementById('h-formule').textContent=d.formule||'';
  document.getElementById('monthly').textContent=d.prix_mensuel;
  document.getElementById('annual').textContent=d.prix_annuel;
  if(input){
    document.getElementById('r-naissance').textContent=fmt(input.date_naissance);
    document.getElementById('r-permis').textContent=fmt(input.date_permis);
    document.getElementById('r-vehicle').textContent=input.vehicle_summary||'—';
  }
  document.getElementById('loading').style.display='none';
  document.getElementById('content').style.display='block';
}
function check(){
  try{var oi=window.openai;if(oi&&oi.toolOutput&&oi.toolOutput.prix_annuel!==undefined){show(oi.toolOutput,oi.toolInput);return;}}catch(e){}
  setTimeout(check,300);
}
check();
</script>
</body>
</html>`;
}

/** Valide les dates côté serveur avant d'appeler Coherent. Lance une Error avec un message lisible. */
function validateDates(date_naissance: string, date_permis: string, date_mec: string): void {
  const ISO_RE = /^\d{4}-\d{2}-\d{2}$/;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const parse = (s: string, label: string): Date => {
    if (!ISO_RE.test(s)) throw new Error(`${label} : format invalide (attendu YYYY-MM-DD, reçu "${s}")`);
    const d = new Date(s);
    if (isNaN(d.getTime())) throw new Error(`${label} : date invalide "${s}"`);
    return d;
  };

  const dn = parse(date_naissance, "date_naissance");
  const dp = parse(date_permis, "date_permis");
  const dm = parse(date_mec, "date_mec");

  // date_naissance dans le passé, âge 18-99
  if (dn >= today) throw new Error("date_naissance : doit être dans le passé");
  const ageAns = (today.getTime() - dn.getTime()) / (365.25 * 24 * 3600 * 1000);
  if (ageAns < 18) throw new Error(`date_naissance : l'utilisateur doit avoir au moins 18 ans (âge calculé : ${Math.floor(ageAns)} ans)`);
  if (ageAns > 99) throw new Error("date_naissance : âge supérieur à 99 ans");

  // date_permis dans le passé, >= 1950, au moins 16 ans après naissance
  if (dp >= today) throw new Error("date_permis : doit être dans le passé");
  if (dp.getFullYear() < 1950) throw new Error("date_permis : antérieure à 1950");
  const agePermis = (dp.getTime() - dn.getTime()) / (365.25 * 24 * 3600 * 1000);
  if (agePermis < 16) throw new Error(`date_permis : le permis a été obtenu avant les 16 ans (écart calculé : ${Math.floor(agePermis)} ans)`);

  // date_mec dans le passé, entre 1980 et aujourd'hui
  if (dm >= today) throw new Error("date_mec : doit être dans le passé");
  if (dm.getFullYear() < 1980) throw new Error("date_mec : antérieure à 1980");
}

const handler = createMcpHandler(async (server) => {
  const widgetHtml = buildWidgetHtml();

  server.registerResource(
    "leocare-quote-widget",
    WIDGET_URI,
    {
      title: "Leocare Quote Widget",
      mimeType: "text/html+skybridge",
      _meta: {
        "openai/widgetDescription": "Carte de tarification assurance auto Leocare",
        "openai/widgetPrefersBorder": false,
        ui: {
          domain: "https://leocare-mcp.vercel.app",
          csp: {
            resourceDomains: [
              "https://fonts.googleapis.com",
              "https://fonts.gstatic.com",
              "https://api.fontshare.com",
            ],
          },
        },
      },
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "text/html+skybridge",
          text: widgetHtml,
          _meta: {
            "openai/widgetDescription": "Carte de tarification assurance auto Leocare",
            "openai/widgetPrefersBorder": false,
            ui: {
              domain: "https://leocare-mcp.vercel.app",
              csp: {
                resourceDomains: [
                  "https://fonts.googleapis.com",
                  "https://fonts.gstatic.com",
                  "https://api.fontshare.com",
                ],
              },
            },
          },
        },
      ],
    })
  );

  server.registerTool(
    "lookupVehicle",
    {
      title: "Rechercher un véhicule par plaque",
      description:
        `Recherche les informations d'un véhicule à partir de sa plaque d'immatriculation.

AVANT d'appeler ce tool, reproduire ce message MOT POUR MOT si ce n'est pas encore fait :
"${ACCROCHE}"

APPELER CE TOOL EN PREMIER, avant toute autre question de profil.

FLOW :
1. L'utilisateur donne sa plaque → appeler immédiatement ce tool
2. Si found=false → afficher exactement : "${VEHICLE_NOT_FOUND_TEMPLATE}"
3. Si 1 véhicule → afficher "${QUESTIONS.confirmVehicle("[summary]")}" et attendre confirmation
4. Si plusieurs véhicules → afficher la liste et demander lequel, puis confirmer
5. Une fois confirmé → poser les questions dans cet ordre, UNE PAR UNE :
   - "${QUESTIONS.naissance}"
   - "${QUESTIONS.permis}"
   - "${QUESTIONS.formule}"
6. Appeler simulateCarInsurance avec toutes les données, en incluant vehicle_summary (le libellé du véhicule confirmé)

NE PAS demander la date de mise en circulation ni la date d'acquisition — elles sont récupérées automatiquement.`,
      inputSchema: {
        registration_number: z.string().describe("Plaque d'immatriculation du véhicule (ex: FA-110-LG ou FA110LG)"),
      } as any,
    },
    async ({ registration_number }: { registration_number: string }) => {
      const result = await lookupVehicleByPlate(registration_number);

      if (!result.found || !result.vehicles) {
        return {
          content: [{ type: "text" as const, text: "VEHICLE_NOT_FOUND" }],
        };
      }

      const vehicles = result.vehicles.map((v, i) => ({
        index: i + 1,
        summary: v.summary,
        date_mec: parseRegistrationDate(v.registrationDate),
        marque: v.make.label,
        classe_sra: v.sraClass,
        groupe_sra: parseInt(v.sraGroup, 10),
      }));

      if (vehicles.length === 1) {
        const v = vehicles[0];
        return {
          content: [{
            type: "text" as const,
            text: `VEHICLE_FOUND_SINGLE\nsummary:${v.summary}\ndate_mec:${v.date_mec}\nmarque:${v.marque}\nclasse_sra:${v.classe_sra}\ngroupe_sra:${v.groupe_sra}\n\nAFFICHER EXACTEMENT : "J'ai trouvé : **${v.summary}**. C'est bien ton véhicule ?"`,
          }],
        };
      }

      const liste = vehicles.map((v, i) => `${i + 1}. ${v.summary}`).join("\n");
      return {
        content: [{
          type: "text" as const,
          text: `VEHICLE_FOUND_MULTIPLE\n${JSON.stringify(vehicles)}\n\nAFFICHER EXACTEMENT :\n"J'ai trouvé plusieurs véhicules pour cette plaque :\n${liste}\nLequel est le tien ?"`,
        }],
      };
    }
  );

  server.registerTool(
    "simulateCarInsurance",
    {
      title: "Simuler un tarif assurance auto Leocare",
      description:
        `Calcule une estimation de tarif d'assurance auto Leocare.

APPELER UNIQUEMENT après que lookupVehicle a été appelé et confirmé, ET que les 4 questions de profil ont été posées.

COLLECTE DES DONNÉES — règles absolues :
- Poser les questions UNE PAR UNE dans cet ordre exact
- Ne jamais poser deux questions dans le même message
- Tutoyer l'utilisateur, ton décontracté
- N'utiliser JAMAIS de bloc de code ni de format monospace dans les messages
- Les questions à poser dans l'ordre, APRÈS confirmation du véhicule :
  1. "${QUESTIONS.naissance}"
  2. "${QUESTIONS.permis}"
  3. Question formule — OBLIGATOIRE : poser exactement "${QUESTIONS.formule}"

RECOMMANDATION DE FORMULE (si l'utilisateur demande une recommandation) :
Calculer l'âge du véhicule (année actuelle - année de date_mec) et l'âge du conducteur (année actuelle - année de date_naissance), puis appliquer :
- Véhicule 0-10 ans → recommander F4
- Véhicule 11-16 ans + conducteur 18-29 ans → recommander F3
- Véhicule 11-16 ans + conducteur 30-34 ans → recommander F2
- Véhicule 11-16 ans + conducteur 35+ ans → recommander F3
- Véhicule 17+ ans → recommander F1
Expliquer brièvement pourquoi (âge du véhicule, profil conducteur), puis proposer de simuler avec cette formule ou une autre.

PARAMÈTRES VÉHICULE :
- date_mec est récupérée via lookupVehicle (registrationDate) — ne pas la demander à l'utilisateur
- date_acquisition = date du jour automatiquement — ne pas la demander à l'utilisateur
CONVERSION DES DATES :
- L'utilisateur saisit en JJ/MM/AAAA → convertir systématiquement en YYYY-MM-DD avant l'appel
- Exemple : "15/03/1990" → "1990-03-15"
- Si l'utilisateur donne une année sur 2 chiffres (ex: "85"), interpréter comme 19xx

VALIDATION AVANT APPEL :
- date_naissance : dans le passé, âge entre 18 et 99 ans
- date_permis : dans le passé, au moins 16 ans après date_naissance, pas antérieure à 1950
- date_mec : dans le passé, entre 1980 et aujourd'hui
- date_acquisition : dans le passé, >= date_mec
- Si une date est invalide ou incohérente, demander poliment de la corriger avant d'appeler

FORMAT DE RÉPONSE APRÈS L'APPEL — reproduire ce bloc EXACTEMENT, sans ajouter ni supprimer un seul mot :
${OUTPUT_TEMPLATE}

INTERDIT après ce bloc : tout commentaire, toute explication, toute suggestion sur le prix ou la couverture.

CAS SPÉCIAUX :
- Si la réponse contient "PROFIL_EXCLU", reproduire exactement :
  "${EXCLUDED_TEMPLATE}"
- Si la réponse contient "PROFIL_NON_ELIGIBLE", reproduire exactement :
  "${INELIGIBLE_TEMPLATE}"`,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mcp-handler n'exporte pas ses types ZodRawShape
      inputSchema: {
        date_naissance: z.string().describe("Date de naissance au format YYYY-MM-DD"),
        date_permis: z.string().describe("Date d'obtention du permis au format YYYY-MM-DD"),
        date_mec: z.string().describe("Date de 1ère mise en circulation au format YYYY-MM-DD — récupérée via lookupVehicle"),
        numero_formule: z.enum(["F1", "F2", "F3", "F4"]).describe(
          "Formule choisie par l'utilisateur — valeurs possibles :\n- F1 — Tiers : couverture responsabilité civile uniquement\n- F2 — Tiers+ Bris De Glace : Tiers + bris de glace\n- F3 — Tiers+ Confort : Tiers + bris de glace + vol & incendie avec garanties étendues\n- F4 — Tous risques : couverture maximale"
        ),
        marque: z.string().optional().describe("Marque du véhicule — récupérée via lookupVehicle"),
        classe_sra: z.string().optional().describe("Classe SRA du véhicule — récupérée via lookupVehicle"),
        groupe_sra: z.number().optional().describe("Groupe SRA du véhicule — récupéré via lookupVehicle"),
        vehicle_summary: z.string().optional().describe("Libellé complet du véhicule (marque + modèle + version) — récupéré via lookupVehicle"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- mcp-handler n'exporte pas ses types ZodRawShape
      } as any,
      outputSchema: z.object({
        formule:      z.string().describe("Nom commercial de la formule choisie"),
        prix_mensuel: z.number().describe("Prix mensuel TTC en euros"),
        prix_annuel:  z.number().describe("Prix annuel TTC en euros"),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- même raison
      }) as any,
      annotations: {
        readOnlyHint: true,
        openWorldHint: false,
        destructiveHint: false,
      },
      _meta: {
        "openai/outputTemplate": WIDGET_URI,
        "openai/toolInvocation/invoking": "Calcul du tarif en cours…",
        "openai/toolInvocation/invoked": "Tarif calculé.",
        "openai/widgetAccessible": false,
        "openai/resultCanProduceWidget": true,
      },
    },
    async ({ date_naissance, date_permis, date_mec, numero_formule, marque, classe_sra, groupe_sra }: {
      date_naissance: string;
      date_permis: string;
      date_mec: string;
      numero_formule: string;
      marque?: string;
      classe_sra?: string;
      groupe_sra?: number;
    }) => {
      try {
        validateDates(date_naissance, date_permis, date_mec);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Dates invalides";
        return {
          content: [{ type: "text" as const, text: `Erreur de validation : ${msg}. Merci de corriger les données avant de relancer.` }],
        };
      }

      const result = await simulateTarif({ date_naissance, date_permis, date_mec, numero_formule, marque, classe_sra, groupe_sra });

      if (!result.eligible) {
        if (result.reason === "exclusion") {
          return {
            content: [{ type: "text" as const, text: "PROFIL_EXCLU" }],
          };
        }
        return {
          content: [{ type: "text" as const, text: `PROFIL_NON_ELIGIBLE: ${result.message}` }],
        };
      }

      return {
        structuredContent: {
          formule: result.formule,
          prix_mensuel: result.prix_mensuel,
          prix_annuel: result.prix_annuel,
        },
        content: [
          {
            type: "text" as const,
            text: `Formule ${result.formule} : à partir de ${result.prix_mensuel} €/mois (${result.prix_annuel} €/an).`,
          },
        ],
        _meta: {
          "openai/outputTemplate": WIDGET_URI,
          "openai/resultCanProduceWidget": true,
        },
      };
    }
  );
}, {
  instructions: `Tu es un assistant de simulation tarifaire pour **Leocare**, néo-assurance auto 100 % digitale.
Ton rôle est d'aider l'utilisateur à obtenir une estimation de prix pour son assurance auto.

COMPORTEMENT GÉNÉRAL :
- Ton décontracté, moderne et bienveillant — tu tutoies l'utilisateur
- Pose TOUJOURS les questions UNE PAR UNE, dans l'ordre — même si l'utilisateur donne plusieurs infos d'un coup
- Ne jamais poser deux questions dans le même message
- N'utilise JAMAIS de bloc de code (pas de backticks, pas de format monospace)
- Ne demande jamais le nom, prénom ou email
- Ne donne pas de conseils juridiques ou financiers
- Si l'utilisateur pose une question hors sujet, ne réponds pas — ramène-le directement vers la simulation
- En cas de profil non éligible (réponse contenant "PROFIL_NON_ELIGIBLE"), réponds exactement ainsi :
  "${INELIGIBLE_TEMPLATE}"
- En cas de profil exclu (réponse contenant "PROFIL_EXCLU"), réponds exactement ainsi :
  "${EXCLUDED_TEMPLATE}"
- En cas de véhicule non trouvé (réponse contenant "VEHICLE_NOT_FOUND"), réponds exactement ainsi :
  "${VEHICLE_NOT_FOUND_TEMPLATE}"

POLITIQUE DE CONFIDENTIALITÉ :
- Si l'utilisateur demande comment ses données sont utilisées, réponds : "Aucune donnée personnelle n'est conservée. Cette simulation est anonyme. Pour en savoir plus : https://leocare.eu/fr/politique-de-confidentialite/"

GESTION DES DATES :
- Accepte tous les formats courants : JJ/MM/AAAA, JJ-MM-AAAA, "15 mars 1990", etc.
- Toujours convertir en YYYY-MM-DD avant d'appeler le tool
- Si une date semble incohérente (ex: permis avant 16 ans, véhicule du futur), signale l'anomalie et demande confirmation avant de continuer
- En cas de doute sur l'année (ex: "né en 82"), préférer demander confirmation plutôt qu'interpréter seul

FLOW DE SIMULATION :
1. Commence TOUJOURS par reproduire ce message MOT POUR MOT, sans rien changer ni reformuler :
   "${ACCROCHE}"
2. L'utilisateur donne sa plaque → appeler immédiatement lookupVehicle
3. Si 1 véhicule trouvé → afficher marque + modèle + version et demander confirmation
   Si plusieurs → lister et demander lequel, puis confirmer
4. Une fois le véhicule confirmé, poser dans l'ordre :
   - "${QUESTIONS.naissance}"
   - "${QUESTIONS.permis}"
   - "${QUESTIONS.formule}" — si l'utilisateur demande une recommandation, appliquer l'algorithme décrit dans simulateCarInsurance avant d'appeler le tool
5. Appeler simulateCarInsurance avec toutes les données (date_mec et données véhicule depuis lookupVehicle)
6. Après l'estimation, reproduis UNIQUEMENT le bloc défini dans la description du tool — rien d'autre.`,
}, { basePath: "", maxDuration: 60 });

import { NextRequest, NextResponse } from "next/server";

function isHumanBrowser(req: NextRequest): boolean {
  const accept = req.headers.get("accept") ?? "";
  return accept.includes("text/html");
}

export async function GET(req: NextRequest) {
  if (isHumanBrowser(req)) {
    return NextResponse.redirect(new URL("/", req.url));
  }
  return handler(req);
}

export async function POST(req: NextRequest) {
  return handler(req);
}
