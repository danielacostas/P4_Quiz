const figlet = require('figlet');
const chalk = require('chalk');

//Colorea un string
const colorize = (msg, color) =>{
	if (typeof color !== "undefined"){
		msg = chalk[color].bold(msg);
	}
	return msg;
};

//Mensaje de log
const log = (msg, color) =>{
	console.log(colorize(msg, color));
};

//Mensaje de log en grande
const biglog = (msg,color) =>{
	log(figlet.textSync(msg, {horizontalLayout:'full'}), color);
};

//Mensaje de error
const errorlog = (emsg) =>{
	log(`${colorize("Error", "red")}: ${colorize(colorize(emsg, "red"), "bgYellowBright")}`);
};

exports = module.exports ={
	colorize,
	log,
	biglog,
	errorlog
};