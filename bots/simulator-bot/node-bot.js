
var NUTELLA = require('nutella_lib');

// Get configuration parameters and init nutella
var cliArgs = NUTELLA.parseArgs();
var componentId = NUTELLA.parseComponentId();
var nutella = NUTELLA.init(cliArgs.broker, cliArgs.app_id, cliArgs.run_id, componentId);
// Optionally you can set the resource Id
//nutella.setResourceId('my_resource_id');


var simdb = nutella.persist.getJsonObjectStore('simdb');
simdb.load();
if (!simdb.hasOwnProperty('data')){
    simdb = {data:
            [
                {   name: 'simulation 1',
                    maxX: 7,
                    maxY: 7,
                    default_temperature: 20,
                    default_precipitation: 'clear',
                    start_time: {h:10,m:0},
                    steps_per_hour: 3,
                    cities: [
                        {name: 'Glenburg', x: 4, y: 1},
                        {name: 'Farmington', x: 7, y: 4},
                        {name: 'Plainville', x: 2, y: 6},
                        {name: 'Bump City', x: 5, y: 7}
                    ],
                    parcels: [
                        {   type: 'temp',
                            pat: [[1,0,1],[1,1,1],[1,1,0]],
                            x0: -1,
                            y0: 0,
                            vx: 1/3, // x-velocity, cells per step
                            vy: 1/3, // y-velocity, cells per step
                            t: 30
                         },
                        {   type: 'temp',
                            pat: [[1,1,0],[1,1,0],[1,0,0]],
                            x0: -4,
                            y0: 0,
                            vx: 1, // x-velocity, cells per step
                            vy: 0, // y-velocity, cells per step
                            t: 10
                         },
                        {   type: 'precip',
                            pat: [[1,0,0],[0,1,1],[1,1,0]],
                            x0: 0,
                            y0: 0,
                            vx: 1/2,
                            vy: 1/2,
                            p: 'rain'
                         }
                    ]
                }

            ]
    };
    simdb.save();
}

var simulations = simdb.data;
var in_simulation = false;

var current_sim = 0;
var clock_time = 0;
var simulation_step = 0;
var clockTicker;
var simulationTicker;
var stop;
var clock_update_frequency;
var simulation_update_frequency;

function weather(s,step) {
    var landMass = [];
    var sim = simulations[s];
    var maxX = sim.maxX;
    var maxY = sim.maxY;
    var default_temperature = sim.default_temperature;
    var default_precipitation = sim.default_precipitation;
    var parcels = sim.parcels;

    for (var i=0; i<maxX; i++){
        landMass[i] = [];
        for (var j=0; j<maxY; j++){
            landMass[i][j] = {t:default_temperature,p:default_precipitation};
        }
    }

    for (var i=0; i<parcels.length; i++){
        var p = parcels[i]; 
        var x = Math.round(p.x0 + step*p.vx);
        var y = Math.round(p.y0 + step*p.vy);
        for (var j=0; j<p.pat.length; j++)
            for (var k=0; k<p.pat[j].length; k++) { 
                if (x+j >=0 && y+k >=0 && x+j < maxX && y+k < maxY && p.pat[j][k]==1) {
                    if (p.type == 'temp') landMass[x+j][y+k].t=p.t;
                    if (p.type == 'precip') landMass[x+j][y+k].p=p.p;
                }
            }
    }

    return(landMass);
};


nutella.net.subscribe('load_simulation',function(message){
    if (in_simulation) return;
    console.log(message);
    current_sim = message.sim; // which simulation are you running?
    var sim_start = message.sim_start;
    var sim_end = message.sim_end;
    var model_start = simulations[current_sim].start_time;
    var steps_per_hour = simulations[current_sim].steps_per_hour;
    var duration = message.duration;

    // set up simulated time clock
    var start = sim_start.hour * 60 + Number(sim_start.minute); // range  0 .. 23*60 + 59
    stop = sim_end.hour * 60 + Number(sim_end.minute); // range  0 .. 23*60 + 59
    var simulated_minutes = stop - start; // range  0 .. 23*60 + 59
    clock_update_frequency = duration/simulated_minutes;
    clock_time = start-1;
    minute_timer();

    // set up simulator steps
    var total_steps = (simulated_minutes/60) * steps_per_hour; 
    simulation_update_frequency = duration/total_steps;
    simulation_step = Math.round((start - (model_start.h*60 + model_start.m))/60 * steps_per_hour) - 1;
    simulation_timer();
});

nutella.net.subscribe('run_simulation',function(message){
    if (in_simulation) return;
    in_simulation = true;
    clockTicker = setInterval (minute_timer,clock_update_frequency * 1000);
    simulationTicker = setInterval (simulation_timer, simulation_update_frequency*1000);
});

nutella.net.handle_requests('get_config', function (message, from){
    var s = simulations[current_sim];
    return ({X_max: s.maxX, Y_max: s.maxY, cities:s.cities});
});


function minute_timer() {
    clock_time++;
    var h = Math.floor(clock_time/60);
    var m = clock_time % 60;
    nutella.net.publish('clock',{h:h,m:m});
    if (clock_time >= stop) {
        clearInterval(clockTicker);
        clearInterval(simulationTicker);
        in_simulation = false;
    };
};

function simulation_timer() {
    simulation_step++;
    var w = weather(current_sim,simulation_step);
    nutella.net.publish('weather_update',w);
};

