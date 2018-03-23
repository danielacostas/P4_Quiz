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
const log = (socket, msg, color) =>{
	socket.write(colorize(msg, color) + "\n");
};

//Mensaje de log en grande
const biglog = (socket,msg,color) =>{
	log(figlet.textSync(msg, {horizontalLayout:'full'}), color);
};

//Mensaje de error
const errorlog = (socket,emsg) =>{
	socket.write(`${colorize("Error", "red")}: ${colorize(colorize(emsg, "red"), "bgYellowBright")}\n`);
};

exports = module.exports ={
	colorize,
	log,
	biglog,
	errorlog
};