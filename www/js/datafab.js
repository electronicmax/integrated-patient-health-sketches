/* globals moment, angular, _, d3*/

angular.module('pchealth')
	.service('datafab', function() {

		var dinner = {
			'chicken roast':50,
			'beef roast':20,
			'spinach casserole':200,
			'bolognese':50,
			'chard':150,
			'broccoli':180
		};

		var this_ = {
			createTimeSeries : (start, end) => {
				if (start && end && start.valueOf() >= end.valueOf()) { throw new Error("start has to be before end"); }
				start = start ? moment(start) : moment().add('days', -180);
				end = end ? moment(end) : moment();
				var days = [];
				while (start < end) { 
					days.push(new Date(start.toDate().valueOf()));
					start = start.add('days',1);
				}
				return days;
			},
			createBase : (start,end) =>  {
				return this_.createTimeSeries(start,end).map((x) => ({date:x}));
			},
			slidingRandom:(base, field, variance, min, max) => { 
				var last = min + (max-min)*Math.random();
				base.map((x) => {
					x[field] = Math.max(min,Math.min(max, last+variance*(Math.random()-0.5))); // Math.min(Math.max(min, last + variance*Math.random()), max);
					last = x[field];
				});
				return base;
			},
			addINRs: (base) => {
				return this_.slidingRandom(base, 'inr', 0.1, 0.5, 4.0); // base.map((x) => _.extend(x,  { inr : 1.5+Math.random() }));
			},
			addINRBiased: (base) => {
				var min = 0.8, max = 3.5,
					last = min + (max-min)*Math.random(),
					ext = d3.extent(_.values(dinner)),
					stdnormal = _.keys(dinner).reduce((arr, k) => { 
						var avg = (ext[1]+ext[0])/2;
						console.log('stdnormal ', k, ext, avg, dinner[k]);

						arr[k] = (dinner[k]-avg)/(ext[1]-ext[0]);
						return arr;
					},{}),
					variance = 0.1;
				console.log('stdnormal' , stdnormal);
				base.map((x) => {
					var bias = stdnormal[x.dinner];
					console.info(' dinner ', x.dinner, bias);

					x.inr = Math.max(min,Math.min(max, last+variance*(Math.random()-0.5 - 5*bias))); // Math.min(Math.max(min, last + variance*Math.random()), max);
					last = x.inr;
				});
				return base;
			},
			addChoice: (base, field, choices) => {
				console.log('choices ', choices);
				var choose = () => choices[Math.floor(choices.length*Math.random())];
				base.map((x) => { x[field] = choose(); });
				return base;
			},
			addDinner:(base) => {
				console.log('dinner choices ', _.keys(dinner));
				return this_.addChoice(base,'dinner',_.keys(dinner));
			},
			test: () => {
				return this_.addINRBiased(this_.addDinner(this_.createBase()));
			}
		};
		window.fab = this_;
		return this_;
	});


