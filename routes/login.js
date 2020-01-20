var express = require('express');
var bcrypt = require('bcryptjs');
var jwt = require('jsonwebtoken');

var SEED = require('../config/config').SEED;

var app = express();
var Usuario = require('../models/usuario');

// Google
var CLIENT_ID = require('../config/config').CLIENT_ID;
const {OAuth2Client} = require('google-auth-library');

const client = new OAuth2Client(CLIENT_ID);

var mdAutenticacion = require('../middleware/autenticacion');

//============================================================
// Autenticacion de Google
//============================================================
app.get('/renuevaToken', mdAutenticacion.verificaToken, (req, res) => {

  var token = jwt.sign({ usuario: req.usuario }, SEED, { expiresIn: 14400 }); // 4 horas

  res.status(200).json({
    ok: true,
    token: token
  });
});

//============================================================
// Autenticacion de Google
//============================================================
async function verify(token) {
  const ticket = await client.verifyIdToken({
      idToken: token,
      audience: CLIENT_ID,  // Specify the CLIENT_ID of the app that accesses the backend
      // Or, if multiple clients access the backend:
      //[CLIENT_ID_1, CLIENT_ID_2, CLIENT_ID_3]
  });

  const payload = ticket.getPayload();
  // const userid = payload['sub'];
  // If request specified a G Suite domain:
  //const domain = payload['hd'];

  return {
    nombre: payload.name,
    email: payload.email,
    img: payload.picture,
    google: true
  }

}

app.post('/google', async(req, res) => {

  var token = req.body.token;

  var googleUser = await verify(token).catch( e => {
    res.status(403).json({
      ok: false,
      mensaje: 'Token no valido'
    });
  });

  Usuario.findOne({ email: googleUser.email }, (err, usuarioDB) => {
    if(err){
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al buscar usuario - google',
        errors: err
      });
    }

    if (usuarioDB) {
      if (usuarioDB.google === false) {
        return res.status(400).json({
          ok: false,
          mensaje: 'Debe usar su autenticacion normal'
        });
      }else{
        var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 }); // 4 horas

        res.status(200).json({
          ok: true,
          usuario: usuarioDB,
          token: token,
          id: usuarioDB._id,
          menu: ObtenerMenu( usuarioDB.role )
        });
      }

    }else{
      // El usuario no existe... hay que crearlo
      var usuario = new Usuario();

      usuario.nombre = googleUser.nombre;
      usuario.email = googleUser.email;
      usuario.img = googleUser.img;
      usuario.google = true;
      usuario.password = ':)';

      usuario.save((err, usuarioDB) => {
        var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 }); // 4 horas

        res.status(200).json({
          ok: true,
          usuario: usuarioDB,
          token: token,
          id: usuarioDB._id,
          menu: ObtenerMenu( usuarioDB.role )
        });
      });

    }

  });

  // res.status(200).json({
  //   ok: true,
  //   mensaje: 'Ok!!',
  //   googleUser: googleUser
  // });

});


//============================================================
// Autenticacion normal
//============================================================


app.post('/', (req, res) => {
  var body = req.body;

  Usuario.findOne({ email: body.email }, (err, usuarioDB) => {

    if(err){
      return res.status(500).json({
        ok: false,
        mensaje: 'Error al buscar usuario',
        errors: err
      });
    }

    if (!usuarioDB) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Credenciales incorrectas - email',
        errors: err
      });
    }

    if ( !bcrypt.compareSync(body.password, usuarioDB.password) ) {
      return res.status(400).json({
        ok: false,
        mensaje: 'Credenciales incorrectas - password',
        errors: err
      });
    }

    // Crear Token
    usuarioDB.password = ':)';
    var token = jwt.sign({ usuario: usuarioDB }, SEED, { expiresIn: 14400 }); // 4 horas

    res.status(200).json({
      ok: true,
      usuario: usuarioDB,
      token: token,
      id: usuarioDB._id,
      menu: ObtenerMenu( usuarioDB.role )
    });
  });

});

function ObtenerMenu( ROLE ){

  var menu = [
    {
      titulo: 'Principal',
      icono: 'mdi mdi-gauge',
      submenu: [
        { titulo: 'Dashboard', url: '/dashboard' },
        { titulo: 'ProgressBar', url: '/progress' },
        { titulo: 'Graficas', url: '/graficas1' },
        { titulo: 'Promesas', url: '/promesas' },
        { titulo: 'Rxjs', url: '/rxjs' }
      ]
    },
    {
      titulo: 'Mantenimientos',
      icono: 'mdi mdi-folder-lock-open',
      submenu: [
        // { titulo: 'Usuarios', url: '/usuarios' },
        { titulo: 'Hospitales', url: '/hospitales' },
        { titulo: 'Medicos', url: '/medicos' }
      ]
    }
  ];

  if (ROLE === 'ADMIN_ROLE') {
    menu[1].submenu.unshift( { titulo: 'Usuarios', url: '/usuarios' } );
  }

  return menu;

}


module.exports = app;