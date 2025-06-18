const bot_AA = require('./bot_avaluo_anterior.js'); // Asegúrate de que la ruta sea correcta
const { chromium } = require('playwright');  // También puedes usar firefox o webkit
const path = require('path');
const fs = require('fs');

(async () => {

    const variables = {
        region: 'REGION METROPOLITANA DE SANTIAGO',
        comuna: 'LAS CONDES',
        direccion: 'la rabida',
        numero: '5575',
    };

    const browser = await chromium.launch({ headless: false }); // headless: true para no mostrar el navegador
    const page = await browser.newPage();

    // Ir a una página objetivo
    await page.goto('https://www2.sii.cl/vicana/Menu/ConsultarAntecedentesSC');

    await bot_AA(page, variables, '782', '9');

    await browser.close();
})();
