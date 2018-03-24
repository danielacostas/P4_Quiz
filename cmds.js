
const Sequelize = require('sequelize');
const {models} = require('./model');
const{log, biglog, errorlog, colorize}= require("./out");

/**
*Muestra la ayuda
**/
exports.helpCmd = (socket ,rl) => {
  		log(socket ," add : añadir un quiz al prgrama");
  		log(socket ," credits : devuelve el nombre de los autores de la practica");
  		log(socket ," list : listar todas las preguntas");
  		log(socket ," show <id> : Muestra la pregunta y la respuesta asociada a id");
  		log(socket ," delete <id> : Elimina la pregunta y la respuesta del quiz");
  		log(socket ," edit <id> : Edita la pregunta y/o la respuesta con el id indicado");
  		log(socket ," test <id> : Probar la pregunta con el id indicado");
  		log(socket ," play/p : Inicia el programa");
  		log(socket ," quit/q : Termina la ejecución del programa");
  		log(socket ," help/h : muestra la ayuda del programa");
  		rl.prompt();

};

/**
*Muestra los creditos y los autores de la practica
**/

exports.creditsCmd = (socket,rl) => {
    	log(socket,'Autores de la practica:');
    	log(socket,'JOSE MANUEL RENGIFO REYNOLDS');
    	log(socket,'DANIEL ACOSTA SALINERO');
    	rl.prompt();
};

/**
*Lista las pregunstas existentes 
**/

exports.listCmd = (socket ,rl) => {
      models.quiz.findAll()
      .then(quizzes => {
        quizzes.forEach(quiz=> {
          log(socket,` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
        });
      })
      .catch(error => {
        errorlog(socket ,error.message);
      })
      .then(()=> {
        rl.prompt();
      });
};


/**
*Esta funcion devuelve una promesa que:
*  - Valida que se ha introducido un valor para el parametro
*  - Convierte el parametro en un numero entero
*Si todo va bien, la promesa se satisface y devuelve el valor de id a usar
*@param id Parametro con el indice a validar
*/

const validateId = id => {
  return new Sequelize.Promise((resolve, reject) => {
    if (typeof id === "undefined"){
      reject(new Error(`Falta el parametro <id>.`));
    } else {
      id = parseInt(id);  //coger la parte entera y descartar lo demas
      if(Number.isNaN(id)) {
        reject(new Error(`El valor del parámetro <id> no es un número.`));
      } else {
        resolve(id);
      }
    }
  });
};

/**
*Muestra el quiz indicado
*
*@param rl Objeto readline usado para implementar el CLI
*@param id Clave del quiz a mostrar
**/

exports.showCmd = (socket ,rl, id) => {
  validateId(id)
  .then(id => models.quiz.findById(id))
  .then(quiz => {
    if (!quiz) {
      throw new Error(`No existe un quiz asociado al id=${id}.`);
    }
    log(socket ,` [${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
  })
  .catch(error => {
    errorlog(socket ,error.message);
  }).then(() => {rl.prompt();});
};

/**
*Esta funcion convierte la llamada rl.question, que esta basada en callbacks, en una basada en promesas
*Esta funcion devuelve una promesa que cuando se cumple, proporciona el texto introducido
*Entonces la llamada a then que hay que hacer la promesa devuelta sera:
*      .then(answer => {...})
*Tambien colorea el texto de la pregunta, elimina espacios al principio y al final
*@param rl Objeto readline usado para implementar el CLI
*@param text Pregunta que hay que hacerle al usuario
*/
const makeQuestion = (rl, text) => {
  return new Sequelize.Promise((resolve, reject) => {
    rl.question(colorize(text, 'red'), answer => {
      resolve(answer.trim());
    });
  });
};


/**
*Añadir nuevo quiz
**/

exports.addCmd = (socket ,rl) => {
  makeQuestion(rl, 'Introduzca una pregunta: ')
  .then(q => {
    return makeQuestion(rl, 'Introduzca la respuesta: ')
    .then(a => {
      return {question: q, answer: a};
    });
  })
  .then(quiz => {
    return models.quiz.create(quiz);
  })
  .then(quiz => {
    log(socket ,` ${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
  })
  .catch(Sequelize.ValidationError, error => {
    error.log(socket ,'El quiz es erroneo: ');
    error.errors.forEach(({message}) => errorlog(message));
  })
  .catch(error => {
    errorlog(error.message);
  })
  .then(() => {
    rl.prompt();
  });
};
 

/**
*Borra el quiz indicado
*
*@param rl Objeto readline usado para implementar el CLI
*@param id Clave del quiz a borrar 
**/

exports.deleteCmd = (socket ,rl, id) => {
    	
  validateId(id)
  .then(id => models.quiz.destroy({where: {id}}))
  .catch(error => {
    errorlog(socket ,error.message);
  })
  .then(() => {
    rl.prompt();
  });
};

/**
*Edita el quiz indicado
**/

exports.editCmd = (socket ,rl, id) => {
  validateId(id)
  .then(id => models.quiz.findById(id))
  .then(quiz => {
    if (!quiz) {
      throw new Error(`No existe un quiz asociado al id=${id}.`);
    }
    process.stdout.isTTY && setTimeout(() => {rl.write(quiz.question)}, 0);
    return makeQuestion(rl, 'Introduzca la pregunta: ')
    .then(q => {
      process.stdout.isTTY && setTimeout(() => {rl.write(quiz.answer)}, 0);
      return makeQuestion(rl, 'Introduzca la respuesta: ')
      .then(a => {
        quiz.question = q;
        quiz.answer = a;
        return quiz;
      });
    });
  })
  .then(quiz => {
    return quiz.save();
  })
  .then(quiz => {
    log(socket ,`Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`)
  })
  .catch(Sequelize.ValidationError, error => {
    errorlog(socket ,'El quiz es erróneo');
    error.errors.forEach(({message}) => errorlog(message));
  })
  .catch(error => {
    errorlog(error.message);
  })
  .then(error => {
    rl.prompt();
  });
};

/**
*Testea la pregunta indicada
**/

exports.testCmd = (socket,rl , id) => {
  validateId(id)
    .then(id => models.quiz.findById(id))
    .then(quiz => {
      if (!quiz) {
        throw new Error(`No existe un quiz asociado al id=${id}.`);
      }
      return makeQuestion(rl, `${quiz.question}?`)
        .then(a=> {
          if (a.toLowerCase().trim() === quiz.answer.toLowerCase().trim()) {
            log(socket,'Su respuesta es: ');
            biglog(socket,'CORRECTA', 'green');
            //rl.prompt();
          } else {
            log(socket,'Su respuesta es: ');
            biglog(socket,'INCORRECTA', 'red');
            //rl.prompt();
          }
        });
    })
    .catch(Sequelize.ValidationError, error => {
      errorlog(socket, 'El quiz es erróneo');
      error.errors.forEach(({message}) => errorlog(message));
    })
    .catch(error => {
      errorlog(socket,error.message);
    })
    .then (() => {
      rl.prompt();
    });
};

/**
*Juega
**/

exports.playCmd = (socket, rl) => {

    let score = 0;
    let toBeResolved = [];
    biglog(socket,`A jugar`, "green");
    models.quiz.findAll()
      .then(quizzes => {
        quizzes.forEach((quiz,id) => {
          toBeResolved[id] =quiz;
        });
        const playOne = () => {
          if (toBeResolved.length === 0) {
            log(socket,`No hay más preguntas`);
            log(socket,`Resultado final: ${score} aciertos`);
            rl.prompt();
          } else {
            let aleatorio = Math.floor(Math.random() * toBeResolved.length);
            let quiz = toBeResolved[aleatorio];
            toBeResolved.splice(aleatorio, 1);
            return makeQuestion(rl, `${quiz.question}?`)
              .then(a => {
                if (quiz.answer.toLowerCase().trim() === a.toLowerCase().trim()) {
                  score++;
                  log(socket,`RESPUESTA CORRECTA`);
                  log(socket,`Llevas ${score} aciertos.`);
                  playOne();
                } else {
                  log(socket,`RESPUESTA INCORRECTA`);
                  log(socket,`Fin del quiz`);
                  log(socket,`Resultado final: ${score} aciertos`);
                }
              })
              .catch(error => {
                errorlog(socket,error.message);
              })
              .then(() => {
                rl.prompt();
              });
          }
        };
        playOne();
      })
      .catch(error => {
        errolog(socket,error.message);
      })
      .then(() => {
        rl.prompt();
      });
};

exports.quitCmd = (socket, rl)=>{
  rl.close();
  socket.end();
};