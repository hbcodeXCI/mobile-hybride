/**
 * Created by roch dardie on 29/06/15.
 */




angular.module('module_app.controllers.menus.tribord.editableLayer', [])

    .controller('cEditableLayer', function cEditableLayer ($scope, $log, sContext,sAppLayer, $state, sPouch) {

        var me = this;
        me.sContext = sContext;
        me.sAppLayer = sAppLayer;

        me.layerforAddDesordre = null;

        me.drawOnMap = function(){

        }
        me.runWithGps =function(){

            $log.debug(sContext.auth)
            $log.debug(sContext.auth.user)
            $log.debug(sContext.auth.user._id)

            sPouch.localDb.post(new oSirsDesordre({author:sContext.auth.user._id})).then(function (response) {
               $log.debug("POST DONE")
               $log.debug(response)
                sContext.activeDesordreId =response.id;


                $log.debug(sContext.activeDesordreId)
                $state.go('forms.desordre');
            }).catch(function (err) {
                console.log(err);
            });
            //$state.go('newDesordre', {layer:me.layerforAddDesordre});
        }




    })