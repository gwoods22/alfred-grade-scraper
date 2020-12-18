require('dotenv').config({ path: __dirname + "/.env" });
const puppeteer = require('puppeteer');
const alfy = require('alfy');

let launchOptions = {
    headless: true
}

/**
 * Main function that runs puppeteer through mosaic interface then scrapes grade text from page and returns data to Alfred
 */
async function getGrades() {
    // terminal flag to check if the 'terminal' parameter was passed, indicating it was run through the terminal
    let terminal =  process.argv[2] === 'terminal'

    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();

    if (terminal) {
        process.stdout.write("\r\x1b[K")
        process.stdout.write("Scraping... 0%");
    }

    await page.goto('https://epprd.mcmaster.ca/psp/prepprd/?cmd=login');  

    if (terminal) {
        process.stdout.write("\r\x1b[K")
        process.stdout.write("Scraping... 20%");
    }
    // username
    await page.waitForSelector("#userid");
    await page.type("#userid", process.env.MOSAIC_USERNAME);

    // password
    await page.waitForSelector("#pwd");
    await page.type("#pwd", process.env.MOSAIC_PASSWORD);

    // submit button
    await page.waitForSelector(".ps_box-button > span > input")
    await page.click(".ps_box-button > span > input")

    if (terminal) {
        process.stdout.write("\r\x1b[K")
        process.stdout.write("Scraping... 40%");
    }
    // grades tile
    await page.waitForSelector(".ps_grid-div.ps_grid-body > div:nth-child(10) > div:nth-child(1) > div", {visible: true});
    await page.click(".ps_grid-div.ps_grid-body > div:nth-child(10) > div:nth-child(1) > div");

    if (terminal) {
        process.stdout.write("\r\x1b[K")
        process.stdout.write("Scraping... 60%");
    }
    // modal ok button
    // await page.waitForSelector("#okbutton input", {visible: true});
    // await page.click("#okbutton input");
    
    //wait for iFrame
    await page.waitForSelector("#ptifrmtarget")
    await page.waitForTimeout(1000)

    // get content iframe
    const target = await page.frames().find(f => f.name() === 'TargetContent')

    // change term
    // await target.waitForSelector("#ACE_width .PSPUSHBUTTON.Left")
    // await target.click("#ACE_width .PSPUSHBUTTON.Left");   

    // fall 2020
    await target.waitForSelector("#ACE_width > tbody > tr:nth-child(4) table table > tbody > tr:nth-child(3) input");
    await target.click("#ACE_width > tbody > tr:nth-child(4) table table > tbody > tr:nth-child(3) input");
    
    // submit button
    await target.waitForSelector("#ACE_width .PSPUSHBUTTON:not(.Left)");
    await target.click("#ACE_width .PSPUSHBUTTON:not(.Left)");

    if (terminal) {
        process.stdout.write("\r\x1b[K")
        process.stdout.write("Scraping... 80%");
    }
    //modal ok button
    await page.waitForSelector("#okbutton input", {visible: true});
    await page.click("#okbutton input");
    
    await page.waitForSelector("#ptifrmtarget")

    // get new content iframe
    const newTarget = await page.frames().find(f => f.name() === 'TargetContent');

    // get raw grade data
    const gradeData = await newTarget.evaluate(() => {
        let rows = Array.from(document.querySelectorAll(".PSLEVEL1GRID > tbody > tr")).slice(1)
        return rows.map(el => {
            let textArr = el.innerText.split('\n');
            return textArr.filter( (el) => /\S/.test(el) );
        })
    });

    await browser.close()

    if (terminal) {
        process.stdout.write("\r\x1b[K")
        process.stdout.write("Scraping... 100%\n");
    }

    let output = gradeData.map(x => (
        {
            title: x.length !== 6 ? 'Ungraded' : x[4],
            subtitle: x[0] + " - " + x[1],
            arg: 'https://mosaic.mcmaster.ca/',
            icon: './icon.png'
        }
    )); 
    
    if (!terminal) {
        alfy.output(output)
    }
        
    // pretty print grade data
    if (terminal) {
        console.log('-------Grade Data-------');
        for (let i = 0; i < gradeData.length; i++) {
            console.log(
                gradeData[i][0], 
                "\t",
                gradeData[i].length !== 6 ? 'Ungraded' : gradeData[i][4]
            );  
        }
    }     
};



getGrades()
