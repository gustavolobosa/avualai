const { chromium } = require('playwright');  // También puedes usar firefox o webkit
const readline = require('readline');

(async () => {

    // Helper para hacer preguntas de forma asincrónica
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    const askQuestion = (question) => {
        return new Promise((resolve) => {
        rl.question(question, (answer) => resolve(answer));
        });
    };

    // Pedir los inputs al usuario
    const variables = {
        region: 'REGIÓN METROPOLITANA DE SANTIAGO',//(await askQuestion('Ingrese la región: ')).toUpperCase(),
        comuna: 'LAS CONDES', //(await askQuestion('Ingrese la comuna: ')).toUpperCase(),
    };

    rl.close(); // cerrar readline cuando ya no se usa
    // Lanzar el navegador
    const browser = await chromium.launch({ headless: false }); // headless: true para no mostrar el navegador
    const page = await browser.newPage();

    // Ir a una página objetivo
    await page.goto('https://www4.sii.cl/mapasui/internet/#/contenido/index.html');

    // presionar un boton con xpath
    await page.waitForSelector('//*[@id="ng-app"]/body/div[5]/div/div/div[3]/div/button');
    await page.click('//*[@id="ng-app"]/body/div[5]/div/div/div[3]/div/button');

    //*[@id="titulo"]/div[7]/i
    await page.waitForSelector('//*[@id="titulo"]/div[7]/i');
    await page.click('//*[@id="titulo"]/div[7]/i');

    // presionar buscar comunas
    await page.waitForSelector('//*[@id="titulo"]/div[5]/i');
    await page.click('//*[@id="titulo"]/div[5]/i');

    // 👉 Función para normalizar texto (quitar tildes y poner mayúsculas)
    const normalizar = str =>
        str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

    // ✅ Seleccionar región
    const regionNormalizada = normalizar(variables.region);

    await page.waitForSelector('#regionSeleccionada');

    const regiones = await page.$$eval('#regionSeleccionada option', opts =>
        opts.map(o => ({ value: o.value, label: o.label }))
    );

    const opcionRegion = regiones.find(o =>
        normalizar(o.label).includes(regionNormalizada)
    );

    if (opcionRegion) {
        await page.selectOption('#regionSeleccionada', opcionRegion.value);
        console.log(`✅ Región seleccionada: ${opcionRegion.label}`);
    } else {
        console.log(`❌ Región "${variables.region}" no encontrada.`);
        await browser.close();
        return;
    }

    // 🕒 Esperar a que se cargue la lista de comunas (depende del sistema, puede necesitar más tiempo)
    await page.waitForTimeout(1000);
    await page.waitForSelector('#comunaSeleccionada');

    // ✅ Seleccionar comuna
    const comunaNormalizada = normalizar(variables.comuna);

    const comunas = await page.$$eval('#comunaSeleccionada option', opts =>
        opts.map(o => ({ value: o.value, label: o.label }))
    );

    const opcionComuna = comunas.find(o =>
        normalizar(o.label).includes(comunaNormalizada)
    );

    if (opcionComuna) {
        await page.selectOption('#comunaSeleccionada', opcionComuna.value);
        console.log(`✅ Comuna seleccionada: ${opcionComuna.label}`);
    } else {
        console.log(`❌ Comuna "${variables.comuna}" no encontrada.`);
        await browser.close();
        return;
    }

    // presionar el boton buscar //*[@id="layersearch"]/div[2]/div[2]/div/button[1]
    await page.waitForSelector('//*[@id="layersearch"]/div[2]/div[2]/div/button[1]');
    await page.click('//*[@id="layersearch"]/div[2]/div[2]/div/button[1]');

    // presionar boton obserbatorio de mercado de suelo //*[@id="layersearch"]/div[2]/div[3]/table/tbody/tr[16]/td[2]/button
    await page.waitForSelector('//*[@id="layersearch"]/div[2]/div[3]/table/tbody/tr[16]/td[2]/button');
    await page.click('//*[@id="layersearch"]/div[2]/div[3]/table/tbody/tr[16]/td[2]/button');

    await page.waitForTimeout(1000); // deja que se cargue
        await page.waitForFunction(() => {
        return document.querySelectorAll('path.leaflet-interactive').length > 0;
    }, { timeout: 60000 });

    // Ahora extraer todas las zonas
    const zonas = await page.$$('path.leaflet-interactive');
    console.log(`Zonas encontradas: ${zonas.length}`);

    // esperar 40 segundos
    await page.waitForTimeout(40000);

    // Cerrar el navegador
    await browser.close();
})();
