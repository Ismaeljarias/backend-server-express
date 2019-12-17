var express = require('express');

var fileUpload = require('express-fileupload');
var fs = require('fs');

var app = express();

var Usuario = require('../models/usuario');
var Medico = require('../models/medico');
var Hospital = require('../models/hospital');

// default options
app.use(fileUpload());

app.put('/:tipo/:id', (req, res, next) => {

  var tipo = req.params.tipo;
  var id = req.params.id;

  // Tipos de coleccion
  var tiposValidos = ['hospitales', 'medicos', 'usuarios'];
  if (tiposValidos.indexOf(tipo) < 0) {
    return res.status(400).json({
      ok: false,
      mensaje: 'Tipo de coleccion no es valida',
      errors: { message: 'Tipo de coleccion no es valida' }
    });
  }

  if (!req.files) {
    return res.status(400).json({
      ok: false,
      mensaje: 'No selecciono nada',
      errors: { message: 'Debe seleccionar una imagen' }
    });
  }

  // Obtener nombre del archivo
  var archivo = req.files.imagen;
  var nombreCortado = archivo.name.split('.');
  var extensionArchivo = nombreCortado[nombreCortado.length - 1];

  // Solo estas extensiones aceptamos
  var extensionesValidas = ['png', 'jpg', 'gif', 'jpeg'];

  if (extensionesValidas.indexOf(extensionArchivo) < 0) {
    return res.status(400).json({
      ok: false,
      mensaje: 'Extension no valida',
      errors: { message: 'Las extensiones validas son: ' + extensionesValidas.join(', ') }
    });
  }

  // Nombre de archivo personalizado
  var nombreArchivo = `${ id }-${ new Date().getMilliseconds() }.${ extensionArchivo }`;

  subirPorTipo( tipo, id, archivo, nombreArchivo, res );

});


function subirPorTipo( tipo, id, archivo, nombreArchivo, res ){
  if (tipo === 'usuarios') {
    Usuario.findById(id, (err, usuario) => {

      if (!usuario) {
        return res.status(400).json({
          ok: true,
          mensaje: 'Usuario no existe',
          errors: { message: 'Usuario no existe' }
        });
      }

      if ((usuario.img.length) > 0) {
        
        var pathViejo = './uploads/usuarios/' + usuario.img;

        // Si existe, elimina la imagen anterior
        if (fs.existsSync(pathViejo)) {
          fs.unlinkSync( pathViejo );
        }

      }

      // Mover el archivo del temporal a un path
      var path = `./uploads/${ tipo }/${ nombreArchivo }`;
      archivo.mv( path, err => {

        if (err) {
          res.status(500).json({
            ok: false,
            mensaje: 'Error al mover archivo',
            errors: err
          });
        }

        
      });

      usuario.img = nombreArchivo;
      
      usuario.save((err, usuarioActualizado) => {
        usuarioActualizado.password = ':)';

        return res.status(200).json({
          ok: true,
          mensaje: 'Imagen de usuario actualizada',
          usuario: usuarioActualizado
        });
      });
    });
  }

  if (tipo === 'medicos') {
    Medico.findById(id, (err, medico) => {

      if (!medico) {
        return res.status(400).json({
          ok: true,
          mensaje: 'Medico no existe',
          errors: { message: 'Medico no existe' }
        });
      }

      if ((medico.img.length) > 0) {
        var pathViejo = './uploads/medicos/' + medico.img;
  
        // Si existe, elimina la imagen anterior
        if (fs.existsSync(pathViejo)) {
          fs.unlinkSync( pathViejo );
        }
      }

      // Mover el archivo del temporal a un path
      var path = `./uploads/${ tipo }/${ nombreArchivo }`;
      archivo.mv( path, err => {

        if (err) {
          res.status(500).json({
            ok: false,
            mensaje: 'Error al mover archivo',
            errors: err
          });
        }

        
      });

      medico.img = nombreArchivo;
      
      medico.save((err, medicoActualizado) => {
        return res.status(200).json({
          ok: true,
          mensaje: 'Imagen de medico actualizada',
          usuario: medicoActualizado
        });
      });
    });
  }

  if (tipo === 'hospitales') {
    Hospital.findById(id, (err, hospital) => {
      if (!hospital) {
        return res.status(400).json({
          ok: true,
          mensaje: 'Hospital no existe',
          errors: { message: 'Hospital no existe' }
        });
      }

      if ((hospital.img.length) > 0) {
        var pathViejo = './uploads/hospitales/' + hospital.img;
  
        // Si existe, elimina la imagen anterior
        if (fs.existsSync(pathViejo)) {
          fs.unlinkSync( pathViejo );
        }
      }

      // Mover el archivo del temporal a un path
      var path = `./uploads/${ tipo }/${ nombreArchivo }`;
      archivo.mv( path, err => {

        if (err) {
          res.status(500).json({
            ok: false,
            mensaje: 'Error al mover archivo',
            errors: err
          });
        }

        
      });


      hospital.img = nombreArchivo;
      
      hospital.save((err, hospitalActualizado) => {
        return res.status(200).json({
          ok: true,
          mensaje: 'Imagen de hospital actualizada',
          usuario: hospitalActualizado
        });
      });
    });
  }
}

module.exports = app;