const { response } = require('express');
const bcryptjs = require('bcryptjs');

const Usuario = require('../models/usuario');
const { generarJWT } = require('../helpers/generarJWT');
const { googleVerify } = require('../helpers/google-verify');

const login = async( req, res = response) => {

    const { correo, password } = req.body;

    try {

        //Verificar si email existe
        const usuario = await Usuario.findOne({ correo });
        if (!usuario){
            return res.status(400).json({
                msg: 'Credenciales incorrectas - email'
            })
        }
        //verificar si el usuario esta activo BD
        if (!usuario.estado ){
            return res.status(400).json({
                msg: 'Credenciales incorrectas - estado false'
            })
        }
        //verificar la contraseña
        const validaPassword = bcryptjs.compareSync( password, usuario.password);
        if (!validaPassword){
            return res.status(400).json({
                msg: 'Credenciales incorrectas - password'
            })
        }
        //generar el JWT
        const token = await generarJWT( usuario.id );

        res.json({
            usuario,
            token
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({ 
            msg: 'Hable con el administrador'
    });

}
}

const googleSignIn = async(req, res = response ) => {

    const { id_token } = req.body;

    try {

        const { nombre, img, correo } = await googleVerify( id_token );

        let usuario = await Usuario.findOne({ correo });

        if ( !usuario ) {
            //tengo crearlo
            const data = {
                nombre,
                correo,
                password: ':P',
                img,
                google: true
            };

            usuario = new Usuario( data );
            await usuario.save();
        }

        // si el usuario en DB 
        if ( !usuario.estado ){
            return res.status(400).json({
                msg: 'Hable con el administrador, usaurio bloqueado'
            });
        }

        const token = await generarJWT( usuario.id );

        res.json({
            usuario,
            token
        })

    } catch (error) {

        json.status(400).json({
            ok: false,
            msg: 'El token no se pudo verificar'
        })
        
    }

    
}

module.exports = {
    login,
    googleSignIn
}