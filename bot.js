const { chromium } = require('playwright');  // También puedes usar firefox o webkit
const readline = require('readline');

//crear nueva funcion para comparar los valores del m2 en la misma manzana pero en distintos predios (del 1 al 10)
async function compararValoresM2(page, manzana, predioInicio, predioFin, valorM2, predio, comuna) {
    console.log(`\nComparando valores del m2 en la manzana ${manzana} desde el predio ${predioInicio} al ${predioFin}:`);
    
    for (let i = predioInicio; i <= predioFin; i++) {

        if (i === parseInt(predio)) {
            console.log(`Saltando el predio ${predio} ya que es el actual.`);
            continue;
        }

        // presionar un boton para buscar por el rol
        await page.waitForSelector('//*[@id="titulo"]/div[8]/i');
        await page.click('//*[@id="titulo"]/div[8]/i');

        // llenar campo //*[@id="addresssearch"]/div[2]/div[1]/input con el rol del predio
        await page.click('//*[@id="rolsearch"]/div[2]/div[1]/input');
        await page.fill('//*[@id="rolsearch"]/div[2]/div[1]/input', '');
        await page.type('//*[@id="rolsearch"]/div[2]/div[1]/input', comuna, { delay: 5 });

        await page.waitForFunction(() => {
        const items = document.querySelectorAll('ul[role="listbox"] li');
        return items.length > 0;
        }, { timeout: 7000 });

        await page.evaluate((comunaObjetivo) => {
        const normalizar = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
        const opciones = document.querySelectorAll('ul[role="listbox"] li');
        const objetivo = normalizar(comunaObjetivo);

        for (const opcion of opciones) {
                const texto = normalizar(opcion.innerText);
                if (texto.includes(objetivo)) {
                opcion.click();
                return;
                }
            }
        }, comuna);

        await page.fill('//*[@id="rolsearch"]/div[2]/div[2]/input', manzana);
        await page.fill('//*[@id="rolsearch"]/div[2]/div[3]/input', String(i));

        // esperar a que aparezca el boton buscar
        await page.waitForSelector('//*[@id="rolsearch"]/div[2]/div[4]/div/button[1]');
        await page.click('//*[@id="rolsearch"]/div[2]/div[4]/div/button[1]');

        // si hay una alerta, pasar al siguiente iteración
        const alerta = page.locator('xpath=//*[@id="ng-app"]/body/div[5]/div/div/div[3]/button');

        if (await alerta.isVisible().catch(() => false)) {
            console.log('Alerta encontrada, pasando al siguiente predio...');
            await alerta.click();
            continue; // <-- Asegúrate de estar dentro de un loop
        }

        //presionar boton (+)
        await page.waitForSelector('//*[@id="preview"]/div[4]/div[1]/div[1]/span');
        await page.click('//*[@id="preview"]/div[4]/div[1]/div[1]/span');

        //obtener el valor del m2
        const valorM2Comparar = await page.locator('//*[@id="preview"]/div[4]/div[1]/div[4]/div').textContent();
        console.log(`Predio ${manzana}-${String(i)} - Valor por Metro Cuadrado: ${valorM2Comparar}`);

        }
    
}

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
        comuna: (await askQuestion('Ingrese la comuna: ')).toUpperCase(),
        direccion: await askQuestion('Ingrese la dirección: '),
        numero: await askQuestion('Ingrese el número: '),
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

    // llenar campo //*[@id="addresssearch"]/div[2]/div[1]/input con variables predefinidas
    await page.click('xpath=//*[@id="addresssearch"]/div[2]/div[1]/input');
    await page.fill('xpath=//*[@id="addresssearch"]/div[2]/div[1]/input', '');
    await page.type('xpath=//*[@id="addresssearch"]/div[2]/div[1]/input', variables.comuna, { delay: 5 });

    await page.waitForFunction(() => {
    const items = document.querySelectorAll('ul[role="listbox"] li');
    return items.length > 0;
    }, { timeout: 7000 });

    await page.evaluate((comunaObjetivo) => {
    const normalizar = str => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    const opciones = document.querySelectorAll('ul[role="listbox"] li');
    const objetivo = normalizar(comunaObjetivo);

    for (const opcion of opciones) {
        const texto = normalizar(opcion.innerText);
        if (texto.includes(objetivo)) {
        opcion.click();
        return;
        }
    }
    }, variables.comuna);


    await page.fill('//*[@id="addresssearch"]/div[2]/div[2]/input', variables.direccion);
    await page.fill('//*[@id="addresssearch"]/div[2]/div[3]/input', variables.numero);

    // seleccionar el boton buscar
    await page.waitForSelector('//*[@id="addresssearch"]/div[2]/div[9]/div/button[1]');
    await page.click('//*[@id="addresssearch"]/div[2]/div[9]/div/button[1]');

    // esperar a que aparezca el boton de ver detalles
    await page.waitForSelector('//*[@id="ng-app"]/body/div[5]/div/div/div/div[2]/table/tbody/tr/td[4]/button', { timeout: 10000 });
    await page.click('//*[@id="ng-app"]/body/div[5]/div/div/div/div[2]/table/tbody/tr/td[4]/button');

    // Extraer los textos
    const rol = await page.locator('//*[@id="preview"]/div[1]/div[4]/span').textContent();
    const ubicacion = await page.locator('//*[@id="preview"]/div[1]/div[6]/div[1]').textContent();
    const destino = await page.locator('//*[@id="preview"]/div[1]/div[6]/div[3]').textContent();
    const reavaluo = await page.locator('//*[@id="preview"]/div[1]/div[6]/div[2]/span').textContent();

    // Mostrar los valores
    console.log('------------------------------------------');
    console.log('Rol Predial:', rol);
    console.log('Ubicacion:', ubicacion);
    console.log('Destino:', destino);
    console.log('Reavaluo:', reavaluo);
    console.log('------------------------------------------');

    // la manzana sera la primera parte del rol antes del guion
    const manzana = rol.split('-')[0].trim();
    const predio = rol.split('-')[1].trim();

    // Extraer los textos
    const avaluoTotal = await page.locator('xpath=//*[@id="preview"]/div[2]/div[2]/span').textContent();
    const avaluoAfecto = await page.locator('xpath=//*[@id="preview"]/div[2]/div[3]/span').textContent();
    const avaluoExento = await page.locator('xpath=//*[@id="preview"]/div[2]/div[4]/span').textContent();

    // Mostrar los valores
    console.log('Avaluo Total:', avaluoTotal);
    console.log('Avaluo Afecto:', avaluoAfecto);
    console.log('Avaluo Exento:', avaluoExento);
    console.log('------------------------------------------');


    // Esperar a que aparezca el botón de (+) para ver detalles de áreas homogéneas
    await page.waitForSelector('//*[@id="preview"]/div[4]/div[1]/div[1]/span');
    await page.click('//*[@id="preview"]/div[4]/div[1]/div[1]/span');

    // Extraer los textos
    const codAreaHomo = await page.locator('//*[@id="preview"]/div[4]/div[1]/div[2]/div').textContent();
    const rangoSupPred = await page.locator('//*[@id="preview"]/div[4]/div[1]/div[3]/div').textContent();
    const valM2 = await page.locator('//*[@id="preview"]/div[4]/div[1]/div[4]/div').textContent();

    // Mostrar los valores
    console.log('Código Área Homogénea:', codAreaHomo);
    console.log('Rango Superficie Predial:', rangoSupPred);
    console.log('Valor por Metro Cuadrado:', valM2);
    console.log('------------------------------------------');

    // Comparar valores del m2 en la misma manzana pero en distintos predios (del 1 al 10)
    compararValoresM2(page, manzana, 1, 20, valM2, predio, variables.comuna);


    // esperar 40 segundos
    await page.waitForTimeout(400000);

    // Cerrar el navegador
    await browser.close();
})();
