const request = require('request');
const net = require('net');
const fs = require('fs');
const config = require('./config.json');

const fgRed = "\x1b[31m";
const fgGreen = "\x1b[32m";
const timeout = config.timeout;


const testService = async service=>{
	let results = [];
	if(service.http) results.push(await testWeb('http://',service));
	if(service.https) results.push(await testWeb('https://',service));
	if(service.ports.length){
		results = [...results, ...(await Promise.all(service.ports.map(async port=>{
			return await testPort(port,service);
		})))];
	}
	return results;
}


const testWeb = (protocol,service)=>{
	return new Promise((resolve,reject)=>{
		request({
			url:protocol + service.hostname + service.testPath,
			timeout
		},(err,res,body)=>{
			if(err) return resolve(fail(service,protocol + ' error: ' + err,protocol));
			if(res.statusCode >= 400) resolve(fail(service, protocol + ' error: status code ' + res.statusCode,protocol));
			else resolve(pass(service,protocol));
		});
	});

}

const testPort = (port,service)=>{
	return new Promise((resolve,reject)=>{
		try{
			const client = net.createConnection(port.port,service.hostname, () => {
				client.unref();
				resolve(pass(service,port));
			});
			client.setTimeout(timeout);
			client.on('timeout', () => {
				client.unref();
				client.destroy();
				resolve(fail(service,'Timed out',port));
			});
			client.on('error',e=>{
				resolve(fail(service,e,port));

			});
		}catch(e){
			reject(fail(service,'',port));
		}
	});


}

const fail = (service,message,port)=>{
	//console.error(`${fgRed}❌ ${service.name} (${service.hostname}) failed on port ${port}: ${message}`);
	if(port.hidden) port = null;
	else if(port.port) port = port.port
	return {
		success:false,
		name:service.name,
		hostname:service.hostname,
		port,
		message:String(message)
	}

}

const pass = (service,port)=>{
	//console.log(`${fgGreen}✓ ${service.name} (${service.hostname}) passed on port ${port}.`);
	return {
		success:true,
		name:service.name,
		hostname:service.hostname,
		port
	}

}


const init = async ()=>{
	let results = (await Promise.all(config.services.map(async service=>{
		return await testService(service);
	}))).flat();
	fs.writeFileSync('test.json',JSON.stringify(results,null,2));
}

init();
