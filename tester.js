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
			if(err) return resolve(fail(service,err,protocol));
			if(res.statusCode >= 400) resolve(fail(service, 'Error: status code ' + res.statusCode,protocol));
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
			console.error(e);
			reject(fail(service,'',port));
		}
	});


}

const fail = (service,message,port)=>{
	//console.error(`${fgRed}❌ ${service.name} (${service.hostname}) failed on port ${port}: ${message}`);
	return {
		success:false,
		name:(port && port.name)?port.name:service.name,
		hostname:service.hostname,
		port:port.hidden?null:port.port?port.port:port,
		message:String(message)
	}

}

const pass = (service,port)=>{
	//console.log(`${fgGreen}✓ ${service.name} (${service.hostname}) passed on port ${port}.`);
	return {
		success:true,
		name:(port && port.name)?port.name:service.name,
		hostname:service.hostname,
		port:port.hidden?null:port.port?port.port:port,
	}

}


const runTest = async ()=>{
	console.log('Starting test.');
	let results = (await Promise.all(config.services.map(async service=>{
		return await testService(service);
	}))).flat();
	console.log('Finished test.');
	return results;
}

module.exports = {
	runTest
}
