/* globals moment, angular, _ */

angular.module('pchealth')
	.service('datafab', function() {
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
			addINRs: (base) => {
				return base.map((x) => _.extend(x,  { inr : 1.5+Math.random() }));
			},
			addChoice: (base, field, choices) => {
				var choose = () => choices[Math.floor(choices.length*Math.random())];
				base.map((x) => { x[field] = choose(); });
				return base;
			},
			addDinner:(base) => {
				var dinnerOpts = ['chicken roast','beef roast','spinach casserole','bolognese'];
				return this_.addChoice(base,'dinner',dinnerOpts);
			},
			test: () => {
				return this_.addDinner(this_.addINRs(this_.createBase()));
			}
		};
		window.fab = this_;
		return this_;
	});


