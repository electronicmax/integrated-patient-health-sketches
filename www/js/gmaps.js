/* globals angular, d3, console, init, $ */

angular.module('pchealth')
	.controller('gmaps', function($scope) {
		init.then(() => { 
			// $scope.map = new google.maps.Map(document.getElementById('map'), {
			//     center: {lat: -34.397, lng: 150.644},
			//     zoom: 8
  	// 	    });
	  	console.info('loading data');		
			$.get('data/storyline.json').then((data) => {
				window.d = data;
				$scope.$apply(() => { 
					$scope.data = data; 
				});
				console.log(data);
			});  		    
	   });
	}).directive('timeline', () => {
		return { 
			restrict:'E', scope:{data:'='}, replace:true,
			template:'<div class="timeline"></div>', 
			link:($s, $e) => { $s.el = $e[0]; },
			controller:($scope) => {
				var render = () => {
					if (!$scope.data) { return; }
					var data = $scope.data;
					data.map((x) => { 
						var d = x.date;
						x.date = new Date([d.slice(0,4),'-',d.slice(4,6),'-',d.slice(6,8)].join(''));
					});
					console.log(data);
					var margin = {top: 20, right: 20, bottom: 30, left: 40},
					    width = 960 - margin.left - margin.right,
					    height = 500 - margin.top - margin.bottom;

					console.log('extent ', d3.extent(data, (x) => x.date));

					var x = d3.time.scale().domain(d3.extent(data, (x) => x.date)).range([0,width]),
						xord = d3.scale.ordinal().domain((x) => x.date).rangeRoundBands([0, width], 0.1);

					window.xtime = x;

					var y = d3.scale.linear().range([height, 0]);
					var xAxis = d3.svg.axis().scale(x).orient("bottom");

					var yAxis = d3.svg.axis()
					    .scale(y)
					    .orient("left")
					    .ticks(10, "%");

					var svg = d3.select($scope.el).append("svg")
					    .attr("width", width + margin.left + margin.right)
					    .attr("height", height + margin.top + margin.bottom)
					  .append("g")
					    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

				  // x.domain(d3.extent(data.map(function(d) { return d.date; })));
				  y.domain([0, d3.max(data, function(d) { return d.segments.length; })]);

				  svg.append("g")
				      .attr("class", "x axis")
				      .attr("transform", "translate(0," + height + ")")
				      .call(xAxis);

				  svg.append("g")
				      .attr("class", "y axis")
				      .call(yAxis)
				    .append("text")
				      .attr("transform", "rotate(-90)")
				      .attr("y", 6)
				      .attr("dy", ".71em")
				      .style("text-anchor", "end")
				      .text("length");

				  svg.selectAll(".bar")
				      .data(data)
				    .enter().append("rect")
				      .attr("class", "bar")
				      .attr("x", function(d) { console.log(d.date, ' ', x(d.date)); return x(d.date); })
				      .attr("width", xord.rangeBand())
				      .attr("y", function(d) { return y(d.segments.length); })
				      .attr("height", function(d) { return height - y(d.segments.length); });
				};
				function type(d) {
				  d.frequency = +d.frequency;
				  return d;
				}					
				$scope.$watch('data', render);
			}
		};
	});