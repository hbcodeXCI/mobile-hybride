angular.module('module_app.services.context', ['module_app.services.utils', 'module_app.services.dao'])

    .constant('defaultContext', {
        // Location state.
        path: '/',
        search: {},

        // Database.
        database: {
            active: 'test',
            list: [
                {
                    name: 'test',
                    url: 'http://5.196.17.92:5984/sirs_symadrem',
                    username: 'geouser',
                    password: 'geopw',
                    replicated: false,
                    favorites: []
                },
                {
                    name: 'azerty',
                    url: 'http://localhost:5984/azerty',
                    username: 'username',
                    password: 'password',
                    replicated: false,
                    favorites: []
                },
                {
                    name: 'qwerty',
                    url: 'http://localhost:5984/qwerty',
                    username: 'username',
                    password: 'password',
                    replicated: false,
                    favorites: []
                }
            ]
        },

        // Authentication.
        authUser: null,

        // Preferences.
        settings: {
            autoSync: true,
            autoGeoloc: false
        },

        // Background layer.
        backLayer: {
            active: 'Bing Aerial',
            list: [
                {
                    name: 'Bing Aerial',
                    type: 'Tile',
                    source: {
                        type: 'BingMaps',
                        key: 'Aj6XtE1Q1rIvehmjn2Rh1LR2qvMGZ-8vPS9Hn3jCeUiToM77JFnf-kFRzyMELDol',
                        imagerySet: 'Aerial'
                    }
                },
                {
                    name: 'OpenStreetMap',
                    type: 'Tile',
                    source: {
                        type: 'OSM',
                        url: 'http://{a-c}.tile.openstreetmap.org/{z}/{x}/{y}.png'
                    }
                },
                {
                    name: 'Landscape',
                    type: 'Tile',
                    source: {
                        type: 'OSM',
                        url: 'http://{a-c}.tile.thunderforest.com/landscape/{z}/{x}/{y}.png'
                    }
                }
            ]
        },

        // Application layers.
        appLayers: [],

        // Others.
        version: 'v0.2.1 -u10'
    })

    .service('ContextService', function ContextService($rootScope, $location, LocalStorageItem, defaultContext) {

        var self = this;

        var contextStorage = new LocalStorageItem('appContext');

        var value = angular.extend(defaultContext, contextStorage.read());


        self.getValue = function() {
            return value;
        };


        // Listen navigation event to store the current view context.
        $rootScope.$on('$locationChangeSuccess', function() {
            value.path = $location.path();
            value.search = $location.search();
        });

        // Store the new value in the local storage on changes.
        $rootScope.$watch(self.getValue, contextStorage.write, true);
    })

    .service('DatabaseService', function DatabaseService($rootScope, $ionicPopup, ContextService) {

        var self = this;

        var dbContext = ContextService.getValue().database;


        self.list = function() {
            return dbContext.list;
        };

        self.add = function(db) {
            dbContext.list.push(db);
            $rootScope.$broadcast('databaseAdded', db);
        };

        self.remove = function(db) {
            return $ionicPopup.confirm({
                title: 'Suppression d\'une base de données',
                template: 'Voulez vous vraiment supprimer cette base de données ?'
            }).then(function(confirmed) {
                if (confirmed) {
                    // Destroy the local database (if exists).
                    new PouchDB(db.name).destroy();
                    // Unregister the remove database.
                    dbContext.list.splice(dbContext.list.indexOf(db), 1);
                    // Broadcast application event.
                    $rootScope.$broadcast('databaseRemoved', db);
                }
                return confirmed;
            });
        };

        self.getActive = function() {
            var i = dbContext.list.length;
            while(i--) {
                var db = dbContext.list[i];
                if (db.name === dbContext.active) {
                    return db;
                }
            }
            return null;
        };

        self.setActive = function(name) {
            var oldValue = dbContext.active;
            dbContext.active = name;
            if (oldValue !== name) {
                $rootScope.$broadcast('databaseChanged', self.getActive(), oldValue);
            }
        };
    })

    .service('BackLayerService', function BackLayerService($rootScope, $ionicPopup, ContextService) {

        var self = this;

        var layerContext = ContextService.getValue().backLayer;


        self.list = function() {
            return layerContext.list;
        };

        self.add = function(layer) {
            layerContext.list.push(layer);
            $rootScope.$broadcast('backLayerAdded', layer);
        };

        self.remove = function(layer) {
            return $ionicPopup.confirm({
                title: 'Suppression d\'une couche',
                template: 'Voulez vous vraiment supprimer cette couche ?'
            }).then(function(confirmed) {
                if (confirmed) {
                    // Unregister the remove database.
                    layerContext.list.splice(layerContext.list.indexOf(layer), 1);
                    // Broadcast application event.
                    $rootScope.$broadcast('backLayerRemoved', layer);
                }
                return confirmed;
            });
        };

        self.getActive = function() {
            var i = layerContext.list.length;
            while(i--) {
                var layer = layerContext.list[i];
                if (layer.name === layerContext.active) {
                    return layer;
                }
            }
            return null;
        };

        self.setActive = function(name) {
            var oldValue = layerContext.active;
            layerContext.active = name;
            $rootScope.$broadcast('backLayerChanged', self.getActive(), oldValue);
        };
    })

    .service('AppLayersService', function AppLayersService($rootScope, $q, LocalDocument, DatabaseService) {

        var self = this;

        var favorites = DatabaseService.getActive().favorites;

        var cachedDescriptions = {
            'core': {
                layers: [
                    {
                        "title": "Tronçons",
                        "fieldToFilterOn": "@class",
                        "filterValue": "fr.sirs.core.model.TronconDigue"
                    },
                    {
                        "title": "Bornes",
                        "fieldToFilterOn": "@class",
                        "filterValue": "fr.sirs.core.model.BorneDigue"
                    },
                    {
                        "title": "Structures",
                        "children": [
                            {
                                "title": "Sommet de risberme",
                                "fieldToFilterOn": "@class",
                                "filterValue": "fr.sirs.core.model.SommetRisberme"
                            },
                            {
                                "title": "Crête",
                                "fieldToFilterOn": "@class",
                                "filterValue": "fr.sirs.core.model.Crete"
                            },
                            {
                                "title": "Pied de digue",
                                "fieldToFilterOn": "@class",
                                "filterValue": "fr.sirs.core.model.PiedDigue"
                            },
                            {
                                "title": "Talus de digue",
                                "fieldToFilterOn": "@class",
                                "filterValue": "fr.sirs.core.model.TalusDigue"
                            },
                            {
                                "title": "Talus de risberme",
                                "fieldToFilterOn": "@class",
                                "filterValue": "fr.sirs.core.model.TalusRisberme"
                            }
                        ]
                    },
                    {
                        "title": "Francs-bords",
                        "children": [
                            {
                                "title": "Largeur de franc bord",
                                "fieldToFilterOn": "@class",
                                "filterValue": "fr.sirs.core.model.LargeurFrancBord"
                            }
                        ]
                    }
                ]
            }
        };


        function moduleDescriptions() {
            var deferred = $q.defer();
            if (!cachedDescriptions) {
                LocalDocument.get('$sirs').then(
                    function onSuccess(result) {
                        cachedDescriptions = result.moduleDescriptions;
                        deferred.resolve(cachedDescriptions);
                    },
                    function onError(error) {
                        deferred.reject(error);
                    });
            } else {
                deferred.resolve(cachedDescriptions);
            }
            return deferred.promise;
        }

        function extractLeaves(nodes, parent) {
            var leaves = [];
            angular.forEach(nodes, function(node) {
                node.categories = angular.isObject(parent) ?
                    parent.categories.concat(parent.title) : [];
                if (angular.isArray(node.children)) {
                    leaves = leaves.concat(extractLeaves(node.children, node));
                } else {
                    leaves.push(node);
                }
            });
            return leaves;
        }


        self.getAvailable = function() {
            var deferred = $q.defer();

            moduleDescriptions().then(
                function onSuccess(modules) {
                    var leaves = [];
                    angular.forEach(modules, function(module) {
                        leaves = leaves.concat(extractLeaves(module.layers));
                    });
                    deferred.resolve(leaves);
                },
                function onError(error) {
                    deferred.reject(error);
                });

            return deferred.promise;
        };

        self.getFavorites = function() {
            return favorites;
        };

        self.addFavorite = function(layer) {
            favorites.push(layer);
            $rootScope.$broadcast('appLayerAdded', layer);
        };

        self.removeFavorite = function(layer) {
            favorites.splice(favorites.map(function(item) {
                return item.title;
            }).indexOf(layer.title), 1);
            $rootScope.$broadcast('appLayerRemoved', layer);
        };


        $rootScope.$on('databaseChanged', function() {
            cachedDescriptions = null;
        });
    })

    .service('AuthService', function AuthService($rootScope, $q, ContextService, LocalDocument, md5) {

        var self = this;

        var context = ContextService.getValue();


        self.isNull = function() {
            return !context.authUser;
        };

        self.getValue = function() {
            return context.authUser;
        };

        self.login = function(login, password) {
            self.logout();

            var deferred = $q.defer();

            $rootScope.$broadcast('loginStart', login);

            LocalDocument.queryOne('Utilisateur/byLogin', login).then(
                function onGetUserSuccess(doc) {
                    if (doc.password === md5.createHash(password).toUpperCase()) {
                        context.authUser = doc;
                        deferred.resolve(doc);
                        $rootScope.$broadcast('loginSuccess', login, doc);
                    } else {
                        deferred.reject();
                        $rootScope.$broadcast('loginError', login);
                    }
                },
                function onGetUserError() {
                    deferred.reject();
                    $rootScope.$broadcast('loginError', login);
                });

            LocalDocument.query('Utilisateur/all').then(function(result) {
                console.log(result);
            });

            return deferred.promise;
        };

        self.logout = function() {
            if (angular.isObject(context.authUser)) {
                return;
            }

            context.authUser = null;
            $rootScope.$broadcast('logoutSuccess');
        };


        $rootScope.$on('databaseChanged', function() {
            context.authUser = null;
        });
    });