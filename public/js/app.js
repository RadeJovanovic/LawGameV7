angular.module('lawGame', ['ui.router', 'youtube-embed', 'ngMaterial', 'ngAria', 'ngAnimate'])

.run(
  [          '$rootScope', '$state', '$stateParams',
    function ($rootScope,   $state,   $stateParams) {
    $rootScope.$state = $state;
    $rootScope.$stateParams = $stateParams;
    }
  ]
)

.config(
  [          '$stateProvider', '$urlRouterProvider', '$locationProvider',
    function ($stateProvider,   $urlRouterProvider, $locationProvider) {
//        $locationProvider.html5Mode(true);
        $urlRouterProvider.otherwise('/login');
        
        $stateProvider
        
            .state('login', {
                url:'/login',
                templateUrl: 'views/login.html',
                controller: 'loginController'
            })
        
            .state('selector', {
                url:'/selector',
                templateUrl: 'views/selector.html',
                controller: 'selectorController'
            
            })
                        
            .state('game', {
                abstract: true,
                url:'/game/:storynumber/:scenenumber',
                templateUrl: 'views/game.html',
                controller: 'gameController',
                resolve: {
                    sceneinfo: ['$stateParams', 'sceneService', function($stateParams, sceneService){
                        var story = $stateParams.storynumber;
                        var scene = $stateParams.scenenumber;                
                        return sceneService.resolveOne(story, scene)
                            .success(function(data){
                                console.log('This is the data coming from the game resolve:')
                                console.log(data)
                                return data;
                            })
                            .error(function(data){
                                console.log('Error: '+ data)
                                return null;
                            })
                    }]
                }
            })
        
            .state('game.media', {
                url:'',
                templateUrl: 'views/game.media.html',
            })
        
            .state('game.question', { 
                url:'/question',
                templateUrl: 'views/game.qhaf.html', //question, hint, answer, feedback
            })
                
            .state('death', {
                url:'/death',
                templateUrl:'views/death.html',
                controller:''
            })
        
            .state('editor', {
                url:'/editor',
                templateUrl: 'views/editor.html',
                controller: 'editorController'
            })
        
            .state('stats', {
                url:'/stats',
                templateUrl: 'views/statistics.html',
                controller: 'statsController'
            });
    }])

/////////////////SERVICES///////////////////////////

.service('loginService', ['$http', '$state', function($http, $state) {
   console.log('I have entered the service')
   this.goToSelector = function(){
          $state.go('selector')
   }
}])

.service('sceneService', ['$http', function($http) {
    console.log('By injecting, I have entered')
    var baseUrl = 'http://localhost:8080'
    
    this.saveNew = function(newScene) {
        var url = baseUrl+'/scenes'
        return $http.post(url, {"newScene": newScene});
    }
    
    this.getAll = function() {
        var url = baseUrl+'/scenes';
        return $http.get(url);
    }
    
    this.updateOne = function(newScene) {
        console.log('The update function is running')
        var url = baseUrl+'/scenes/'+ newScene._id;
        return $http.put(url, {"newScene": newScene});
    }
    
    this.deleteOne = function(id){
        var url = baseUrl+'/scenes/'+id;
        return $http.delete(url);
    }
    
    this.findOne = function(id){
        var url = baseUrl+'/scenes/'+id;
        return $http.get(url);
    }
    
    this.resolveOne = function(story, scene){
        var url = baseUrl+'/scenes/'+story+'/'+scene;
        return $http.get(url);
    }
}])
    
//////////////////CONTROLLERS//////////////////////

.controller('loginController', ['loginService', '$scope', '$state', 
                        function(loginService,   $scope,   $state) {

	$scope.tagline = 'This is the login page';
    $scope.login = function(){
        console.log('Yay you logged in!!')
        loginService.goToSelector()
    };
}])
//
.controller('selectorController', ['$scope', 'sceneService', '$state',
                        function(   $scope,   sceneService,   $state) {
    console.log('selectorController running')
    
    getAllScenes();
    var allScenes = returnAllScenes();
//    console.log($scope.scenes) //why is this returning undefined, 
    console.log(allScenes)
    filterFirstScenes();
     
    $scope.play = function(s){
        var story = s.storynumber;
        $state.go('game.media', {storynumber: story, scenenumber: 1});
    }            
    
    function getAllScenes() {
        sceneService.getAll()
            .success(function(data){
                $scope.scenes = data;
                var allScenes = data;
                console.log($scope.scenes); //This prints
                return allScenes;
            })
            .error(function(data){
                console.log('Error: '+ data);
            });
    }
                            
    function returnAllScenes() {
        return sceneService.getAll()
            .success(function(data){
                var allScenes = data;
                console.log(allScenes)
                return allScenes;
            })
            .error(function(data){
                console.log('Error: '+ data);
            });
    }
                            
    function filterFirstScenes(){
        console.log($scope.scenes) //To check whether it is reading it
//        var firstScenes = allScenes.filter(function(scene){
////        $scope.firstScenes = $scope.scenes.filter(function(scene){
//            if (scene.scenenumber===1){
//                return true;
//            }
//            else {return false}
//        })        
    }
}])

.controller('gameController', ['$scope', 'sceneinfo', '$stateParams', '$sce', '$state', '$timeout',
                    function(   $scope,   sceneinfo,   $stateParams,   $sce,   $state,   $timeout) {

//  View setup
    var sceneInfo = sceneinfo.data;
    $scope.sceneInfo = sceneInfo;
    $scope.nextScene = sceneInfo.scenenumber+1;
    $scope.videoID = sceneInfo.resource; // videoID gets passed to the directive
    var startInSeconds = sceneInfo.startTime.minutes*60+sceneInfo.startTime.seconds;
    var endInSeconds = sceneInfo.endTime.minutes*60+sceneInfo.endTime.seconds;  
                            
//  Changing gameplay mode
    $scope.playerVars = {controls: 0, autoplay: 1, start:startInSeconds, end:endInSeconds};
    $scope.$on('youtube.player.ended', function ($event, player) {
        $state.go('game.question', {storynumber: sceneInfo.storynumber, scenenumber: sceneInfo.scenenumber})
    });                
    
//  Gameplay
    $scope.isQuestion = true;
    $scope.isHint = false;
    $scope.answer = {};
    $scope.isFeedback = false;
    $scope.authorityError = false;
    $scope.nullAnswerError = false;
    $scope.authority = {};
//    var questionDelay = sceneInfo.maxTime;
    var questionDelay = 5000 //this should be the video time plus the question time, but actually no, as we do not get out of the game controller in the entire sequence, so must use a timerService that employs the current date
    // ACTUALLY, EACH TIME WE PRESS NEWSCENE, THE TIMER CAN BE RESTARTED
                        
    $scope.$on('$viewContentLoaded', function(){
        $timeout(outOfTime, questionDelay) //NOT ALLOWED TO USE PARENTHESES ON THE OUTOFTIME!!!
    });
    
    $scope.nextScene = function(answer){
        var nextDigit = answer;
        var next1 = $scope.sceneInfo.answer1.next;
        console.log(next1)
        var next2 = $scope.sceneInfo.answer2.next;
        console.log(next2)
        if (nextDigit==1) {var appropriateNextScene = next1;}
        else {var appropriateNextScene = next2;}
        $state.go('game.media', {scenenumber: appropriateNextScene})
    }
     
     $scope.changeQH = function(){
         $scope.isHint = !($scope.isHint);
     }
     
     $scope.submitResponse = function(answer){
         console.log(answer)
          if ((answer!==1)||(answer!==2)){$scope.nullAnswerError = true; console.log('No Answer')}
         console.log($scope.authority)
         if (isNull(authority)){$scope.authorityError = true; console.log('No Authority')}
         else {$scope.isFeedback = !($scope.isFeedback)}
     }
     
     function isNull(object){
          for (var i in object){
              return true;
          } 
         return false;
     }
             
    function outOfTime(answer){ //this function is meant to automatically submit the answer and receive feedback and go into the feedback state if allowed time is exceeded
        console.log('You are out of time!')
        // First check whether appropriate input, if not, automatically zero points and points lost
        // Then 
    }
}])

.controller('editorController', ['$scope', 'sceneService',
                        function( $scope,   sceneService) {
    
    $scope.newScene = {};
    $scope.editing = false;
    console.log('Editing = ' + $scope.editing)
      
    getAllScenes(); //Do this on page landing
                            
    $scope.saveScene = function(){
        //Rules: each story must have a number 1 scene
        
        //check if scene is ok to save
        //check if the story has a new 
        saveScene();
        getAllScenes();
        //when saving scene, need to check whether linking scene has been made, and if not, create an empty linking scene. 
    };
    
    $scope.deleteScene = function(id){
        deleteScene(id);
        getAllScenes();
    };
               
    $scope.editScene = function(id){
        editScene(id);
        $scope.editing = true
        console.log('Editing = ' + $scope.editing)
    };
                            
    $scope.updateScene = function(){
        updateScene($scope.newScene)
        $scope.editing = false
        console.log('Editing = ' + $scope.editing)
        getAllScenes();
    }
    
    function getAllScenes() {
        sceneService.getAll()
            .success(function(data){
                $scope.scenes = data;
                console.log($scope.scenes);
            })
            .error(function(data){
                console.log('Error: '+ data);
            });
    }
                            
    function saveScene() {
        sceneService.saveNew($scope.newScene)
            .success(function(data){
                console.log(data);
                $scope.newScene = {}
                $scope.editing = false;
                console.log('Editing = ' + $scope.editing)
            })
            .error(function(data){
                console.log('Error: ' + data);
            })
    }
    
    function deleteScene(id) {
        sceneService.deleteOne(id)
            .success(function(data){
                $scope.scenes = data; //this is the new set of scenes returned after the delete
            })
            .error(function(data){
                console.log('Error: '+ data)
            });
    }
                            
    function editScene(id){
        sceneService.findOne(id)
            .success(function(data){
                $scope.newScene = data
                
            })
            .error(function(data){
                console.log('Error: '+ data)
            })
    }
                            
    function updateScene(newScene) {
        console.log('From updateScene function: I am trying to update a scene')
        console.log(newScene)
        sceneService.updateOne(newScene)
            .success(function(data){
                $scope.scenes = data;
                $scope.newScene = {}
            })
            .error(function(data){
            console.log('Error ' + data)
        }) 
    }
                            
}])

.controller('statsController', function($scope) {

	$scope.tagline = 'This is the statistics page';

})

/////////////////DIRECTIVES//////////////////////

.directive('storyInfo', function() {
    return {
        restrict: 'E',
        scope: {
            sceneInfo: '=info'
        },
//        templateUrl: 'js/directives/story-info.hmtl'
        template: '<img class="icon" ng-src="{{sceneInfo.thumbnail}}"><h2 class="title">Story:{{sceneInfo.storynumber}}</h2>'
    };
});