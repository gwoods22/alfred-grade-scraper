const alfy = require('alfy');

const puppeteer = require('/Users/graeme/Developer/puppeteer-tests/grade-scraper.js')

async function getGrades() {
    try {
        let gradeData = await puppeteer.scrape();

        let output = gradeData.map(x => (
            {
                title: x.grade,
                subtitle: x.courseName,
                icon: './icon.png',
                arg: 'https://mosaic.mcmaster.ca/'
            }
        ));

        alfy.output(output)   
    } catch (e) {
        alfy.output([{
            title: e.name,
            subtitle: e.message,
            icon: './icon.png'
        }])
    }
};
getGrades()