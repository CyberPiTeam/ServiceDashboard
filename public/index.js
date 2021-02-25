const init = async ()=>{
	await doUpdate();
	setInterval(doUpdate,1000 * 60)
}


const doUpdate = async ()=>{
	const results = await getResults();
	console.log(results);
	const div = document.getElementById('results');
	div.innerHTML = '';
	results.map(result=>makeElement(result)).forEach(ele=>div.appendChild(ele));

}

const makeElement = result=>{
	const span = document.createElement('div');
	span.innerText = `${result.success?'✔️':'❌'} ${result.name} (${result.hostname}) ${result.success?'passed':'failed'} on port ${result.port?result.port:'[Redacted]'} ${result.message?(': ' + result.message):''}`;
	span.className = result.success?'pass':'fail';
	return span;
}


const getResults = async ()=>{
	return await(await fetch('/testResults')).json()
}


window.addEventListener('load',()=>{
	init();
});
