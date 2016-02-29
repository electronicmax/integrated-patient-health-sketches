/* globals angular, d3, _, console, $ */
angular.module('pchealth')
	.directive('parline', () => ({
		scope:{data:'=', hide:'='},
		restrict:'E',
		replace:true,
		template:'<div class="parline"></div>',
		link: ($s, $e) => {	
			$s.el = $e[0]; 
			// $s.$watch(
			//     function () { 
			//     	console.info('pxh', $e.parent()[0], $e.parent().width(), $e.parent().height());
			//         return {
			//            width: $($e[0]).width(),
			//            height: $($e[0]).height(),
			//         };
			//    },
			//    () => { console.info('resize '); $s.render(); }, //listener 
			//    true //deep watch
			// );	
			$s.$watch('hide', () => { 
				if ($s.hide === true) { 
					console.info('FADING out', $s.hide);
					return $($e[0]).fadeOut(); 
				}
				console.info('FADING in', $s.hide);
				$($e[0]).fadeIn();
			});
		},
		controller: ($scope, $timeout) => {
			var margin = {top: 20, right: 20, bottom: 50, left: 40},
	  	        width = 960 - margin.left - margin.right,
			    height = 500 - margin.top - margin.bottom;


			$scope.render = () => {
				var data = $scope.data;

				if (data === undefined || !$scope.el) { return; }

			    width = $($scope.el).width() - margin.left - margin.right;
			    height = $($scope.el).height() - margin.top - margin.bottom;

				// setup x 
				var xValue = (d) => d.date, // data -> value
					xExt = d3.extent(data.map(xValue)),
				    xScale = d3.time.scale().domain(xExt).range([0, width]), // value -> display
				    xMap = function(d) { return xScale(xValue(d));}, // data -> display
				    xAxis = d3.svg.axis().scale(xScale).orient("bottom");

				// setup y
				var yValue = (d) => d.inr,
					yExt = d3.extent(data.map(yValue)),
				    yScale = d3.scale.linear().domain([yExt[0],4]).range([height, 0]), // value -> display
				    yMap = function(d) { return yScale(yValue(d));}, // data -> display
				    yAxis = d3.svg.axis().scale(yScale).orient("left");

				// setup fill color
				// var cValue = function(d) { return d.Manufacturer;},
				//     color = d3.scale.category10();

				// add the graph canvas to the body of the webpage

				d3.selectAll('svg.parline').remove();

				var svg = d3.select($scope.el).append("svg")
					.attr('class', 'parline')
				    // .attr("width", width + margin.left + margin.right)
				    // .attr("height", height + margin.top + margin.bottom)
				  .append("g")
				    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

			  // don't want dots overlapping axis, so add in buffer to data domain
			  // xScale.domain([d3.min(data, xValue)-1, d3.max(data, xValue)+1]);
			  // yScale.domain([d3.min(data, yValue)-1, d3.max(data, yValue)+1]);

			  // x-axis
			  svg.append("g")
			      .attr("class", "x axis")
			      .attr("transform", "translate(0," + height + ")")
			      .call(xAxis)
			    .append("text")
			      .attr("class", "label")
			      .attr("x", width)
			      .attr("y", -6)
			      .style("text-anchor", "end")
			      .text("Date");

			  // y-axis
			  svg.append("g")
			      .attr("class", "y axis")
			      .call(yAxis)
			    .append("text")
			      .attr("class", "label")
			      .attr("transform", "rotate(-90)")
			      .attr("y", 6)
			      .attr("dy", ".71em")
			      .style("text-anchor", "end")
			      .text("inr");

			  // draw dots
			  svg.selectAll(".dot")
			      .data(data)
			    .enter().append("circle")
			      .attr("class", "dot")
			      .attr("r", 3.5)
			      .attr("cx", xMap)
			      .attr("cy", yMap);
			};
			$timeout(() => { 
				$scope.$watch('data',$scope.render);
				$scope.render();
			}, 1000);
		}
	}));
