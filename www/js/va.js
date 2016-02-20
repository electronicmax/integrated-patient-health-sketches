/* globals $, d3, _, console */

$(document).ready(function() { 
	// d3.select('body').append('svg').attr('id','vis').attr('width',screen.width).attr('height',400);
	d3.select("#vis").attr('style',
		['width:', ''+($(window).width()-100), 'px;', 'height:', ''+$(window).height(), 'px;'].join('')
	);
	d3.csv('data/kinships.csv', (data) => {
		console.info(data);

		// normalise the horrible names with spaces
		data = _(data).map((d) => { 
			return _.reduce(d, (result, value, key) => {
			    key = key.replace(/[\s\.\+]/g, '').toLowerCase();
			    // if (key == 'nodeid') { 
			    // 	value = 'id'+value; 
			    // 	console.log(value);
			    // }
			    result[key] = value;
			    return result;
			}, {});			
		});

		// get rid of ones without nodeid -- extra blank rows thanks, excel!
		data = _(data).filter((d) => d.nodeid && d.nodeid.length > 0);

		// select some dimensions for fun first
		data = _(data).map((d) => { return _(d).pick('nodeid', 'gender', 'hsdistance', 'pgdistance', 'generation'); });

		// d3.parcoords()("#vis").data(data).detectDimensions().render().ticks(3).createAxes();
		d3.parcoords()("#vis").data(data).dimensions(['nodeid','gender','hsdistance','pgdistance','generation']).types({
			'nodeid':'string',
			'gender':'string',
			'hsdistance':'number',
			'pgdistance':'number',
			'generation':'string'}
		).render().brushMode("1D-axes").reorderable().interactive().createAxes();

		window.data = data;
	});
});