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
                controller: 'selectorController',
                resolve: {
                    sceneinfo: ['$stateParams', 'sceneService', function($stateParams, sceneService){
                        return sceneService.getAll()
                            .success(function(data){
                                return data;
                            })
                            .error(function(data){
                                console.log('Error: '+ data)
                                return null;
                            })
                    }]
                }
            })
                        
            .state('game', {
                abstract: true,
                url:'/game/:storynumber/:scenenumber',
                templateUrl: 'views/game.html',
                controller: 'gameController',
                resolve: {
                    singlesceneinfo: ['$stateParams', 'sceneService', function($stateParams, sceneService){
                        var story = $stateParams.storynumber;
                        var scene = $stateParams.scenenumber;                
                        return sceneService.resolveOne(story, scene)
                            .success(function(data){
//                                console.log(data)
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
   this.goToSelector = function(){
          $state.go('selector')
   }
}])

.service('sceneService', ['$http', function($http) {
    
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

.service('timerService', ['$state', '$timeout', function($state, $timeout){
    
    console.log('Injecting the timer (perhaps again)')
//    this.startTimer = function(answerTime){
//        var answerDelay = 1000*(answerTime.minutes*60+answerTime.seconds);
//        var answerTimeout = $timeout(outOfTime, answerDelay)
//    }
    
    this.timeBetween = function(startTimeFromController){
        var endTime = Date.now();
        var startTime = startTimeFromController;
        var duration = (endTime-startTime)/1000 //converting to seconds from milliseconds
        console.log('The time it took to answer question is: '+duration)
        return duration
    }
    
    function playProgressBar(){
        console.log('Long method progress bar')
    }

//    function outOfTime(){ //this function is meant to automatically submit the answer and receive feedback and go into the feedback state if allowed time is exceeded
//        console.log('You are out of time!')
//        $state.go('death')
//Cannot do any of the below as scope is not defined
        //        $scope.isHint = false;
//        $scope.hintButton = false;
//        $scope.isFeedback = true;
        
        // First check whether appropriate input, if not, automatically zero points and points lost
        // Then 
//    }
}])
    
//////////////////CONTROLLERS//////////////////////

.controller('loginController', ['loginService', '$scope', '$state', 
                        function(loginService,   $scope,   $state) {

    $scope.login = function(){
        console.log('Yay you logged in!!')
        loginService.goToSelector()
    };
                            
    $scope.studyMaterial = function(){
        var win = window.open('http://www.australiancontractlaw.com/law.html')
        win.focus;
    }
}])
//
.controller('selectorController', ['$scope', 'sceneService', '$state', 'sceneinfo',
                        function(   $scope,   sceneService,   $state,   sceneinfo) {
    
    var sceneInfo = sceneinfo.data;
    $scope.scenes = sceneInfo;
   
    $scope.play = function(s){
        var story = s.storynumber;
        $state.go('game.media', {storynumber: story, scenenumber: 1});
    }            
            
    $scope.firstScenes = $scope.scenes.filter(function(scene){
        if (scene.scenenumber===1){
            return true;
        }
        else {return false}
    });
}])

.controller('gameController', ['$scope', 'singlesceneinfo', '$stateParams', '$sce', '$state', '$timeout', '$interval', 'timerService', '$rootScope',
                    function(   $scope,   singlesceneinfo,   $stateParams,   $sce,   $state,   $timeout, $interval, timerService, $rootScope) {

    console.log('You have entered the game controller')

    var sceneInfo = singlesceneinfo.data;
    $scope.sceneInfo = sceneInfo;
    console.log(sceneInfo)
    $scope.videoOrImage = sceneInfo.resourceType;
    if ($scope.videoOrImage=="video"){
        $scope.video = true;
    }
    else {$scope.video = false;}
    $scope.videoID = sceneInfo.resource; // videoID gets passed to the directive
    var startInSeconds = sceneInfo.startTime.minutes*60+sceneInfo.startTime.seconds;
    var endInSeconds = sceneInfo.endTime.minutes*60+sceneInfo.endTime.seconds;  
    $scope.playerVars = {controls: 0, autoplay: 1, start:startInSeconds, end:endInSeconds};
             
    $scope.isQuestion = true;
    $scope.isHint = false;
    $scope.answer = {};
    $scope.isFeedback = false;
    $scope.authority = {};
    $scope.hintButton = true;

    $scope.changeQH = function(){
        $scope.isHint = !($scope.isHint);
    }
    
    $scope.$on('youtube.player.ended', function ($event, player) {
        $state.go('game.question', {storynumber: sceneInfo.storynumber, scenenumber: sceneInfo.scenenumber})
    });   

    var answerTimeout;
    $scope.$on('$viewContentLoaded', function(){
    if ($state.includes("game.question")){
        playProgressBar();
        var answerDelay = 1000*(sceneInfo.answerTime.minutes*60+sceneInfo.answerTime.seconds);
        answerTimeout = $timeout(outOfTime, answerDelay);
        $rootScope.startOfQuestion = Date.now();
    }});
    
    $scope.submitResponse = function(answer){
        console.log($rootScope.startOfQuestion)
        console.log(answer.response)
        $scope.authorityError = false;
        $scope.nullAnswerError = false;
        //write a case statement
        if (answer.response=="1"||answer.response=="2"){
            console.log('Valid answer')
            if ($scope.authority.text!==undefined){
                var timeTaken = timerService.timeBetween($rootScope.startOfQuestion)
                $interval.cancel(answerTimeout)
                console.log('Time taken for answer: '+timeTaken)
                $scope.isFeedback = true; 
                $scope.hintButton = false;
                $scope.isHint = false;
                console.log('Valid authority')
            }
            else {
                $scope.authorityError=true;
            }
        }
        else {
            console.log('Error: invalid answer')
            $scope.nullAnswerError=true;
        }   
     }
     
    $scope.nextScene = function(answer){
        console.log(answer)
        //This had to be done in such a poor manner due to the structure of the database
        if (answer.response==1) {var appropriateNextScene = $scope.sceneInfo.answer1.next;}
        else if (answer.response==2) {var appropriateNextScene = $scope.sceneInfo.answer2.next;}
        else if (answer.response==3) {var appropriateNextScene = $scope.sceneInfo.answer3.next;}
        else if (answer.response==4) {var appropriateNextScene = $scope.sceneInfo.answer4.next;}
        $scope.progressBarValue = 0;
        $state.go('game.media', {scenenumber: appropriateNextScene})
    }
     
     function isNotNull(object){
         console.log('This is coming from the isNotNull function ' + object) 
         for (var i in object){
              return true;
          } 
         return false;
     }
            
    //Progress bar stuff
    function playProgressBar(){
        var answerTimeSeconds = sceneInfo.answerTime.minutes*60+sceneInfo.answerTime.seconds;
        console.log(sceneInfo.answerTime);
        $scope.progressBarValue = 0;
        $interval(function() {
            $scope.progressBarValue += (10/answerTimeSeconds)
            if ($scope.progressBarValue > 100) {
                $scope.progressBarValue = 100;
            }
        }, 100, 0, true);
    }
                        
    function outOfTime(){
        console.log('You are out of time!')
        $state.go('death')
    }
}])

.controller('editorController', ['$scope', 'sceneService',
                        function( $scope,   sceneService) {
    
    $scope.newScene = {};
    $scope.editing = false;
    getAllScenes(); //Do this on page landing
                            
    $scope.saveScene = function(){
        //Rules: each story must have a number 1 scene
        console.log($scope.newScene)
        if (isNotNull($scope.newScene)){
            console.log('Please enter something in the scene')
        }
        //check if scene is ok to save
        //check if the story has a new 
        else{
        saveScene();
        getAllScenes();
        }
        //when saving scene, need to check whether linking scene has been made, and if not, create an empty linking scene. 
    };
    
    $scope.deleteScene = function(id){
        deleteScene(id);
        getAllScenes();
    };
               
    $scope.editScene = function(id){
        editScene(id);
        $scope.editing = true
//        console.log('Editing = ' + $scope.editing)
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
//                console.log($scope.scenes);
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
//                console.log('Editing = ' + $scope.editing)
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
                            
    function isNotNull(object){
         console.log('This is coming from the isNotNull function ' + object) 
         for (var i in object){
              return true;
          } 
         return false;
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