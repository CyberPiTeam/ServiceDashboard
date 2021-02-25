const express = require('express');
const tester = require('./tester');
const app = express();
const PORT = 8080;
/* Retest every minute */
const RUN_INTERVAL = 1000 * 60;
const publicPath = './public';
let testResults;

app.use(express.static(publicPath));

app.get('/testResults',(req,res)=>{
	res.send(testResults);
});



const init = async()=>{
	/*Run a test before launching webserver*/
	testResults = await tester.runTest();
	/* Retest every run interval */
	setInterval(async ()=>{
		testResults = await tester.runTest();
	}, RUN_INTERVAL);
	app.listen(PORT,()=>{
		console.log(`Listening on port ${PORT}.`);
	});
}
init();
