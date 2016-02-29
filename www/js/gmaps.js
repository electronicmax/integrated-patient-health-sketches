/* globals angular, d3, console, init, $, google, _ */

var fromMovesDate = function(m_date) {
    console.log('from Moves Date >> ', m_date);
    var year = m_date.slice(0,4), m = m_date.slice(4,6), d = m_date.slice(6,8);
    var hour = m_date.slice(9,11), min = m_date.slice(11,13), sec = m_date.slice(13,15);
    var newdate = [year, m, d].join('/');
    var newtime = [hour,min, sec].join(':');
    var toret =  new Date(newtime + ' ' + newdate);
    console.log('to return >> ', toret);
    return toret;
};

angular.module('pchealth')
	.controller('gmaps', function($scope) {
		init.then(() => { 
			var map = new google.maps.Map(document.getElementById('map'), {
			    center: {lat: -34.397, lng: 150.644},
			    zoom: 15
		    }), pLs = [], 
		    markers = {},
		    selectMarker = (m) => {  
		    	var lat = m.getPosition().lat(),
		    		lon = m.getPosition().lng();
		    	console.info('marker', m, m.__data, lat, lon); 
		    	$scope.$apply(() => { $scope.selected = m; });
		    };
		    
			$.get('data/storyline.json').then((data) => {
				window.d = data;
				$scope.$apply(() => { $scope.data = data; });
			});  		    

			var selectDay = (day) => {
				if (!day) { return; }
				// console.log('day selected ', x);
				if (pLs.length > 0) {
					pLs.map((pL) => pL.setMap(null));
					pLs = [];
				}
				_.keys(markers).map((mk) => {
					if (mk == '_') { 
						markers[mk].map((m) => m.setMap(null));
					} else {
						markers[mk].setMap(null);
					}
				});
				markers = {};
				day.segments.map((x) => {

					if (x.type == 'place') {
						var lat = x.place.location.lat, 
							lng = x.place.location.lon,
							name = x.place.name;
						console.info('place >> ', name, lat,lng );
						if (name !== undefined && !markers[name]) { 
							markers[name] = new google.maps.Marker({
							    position: {lat: lat, lng: lng},
							    map: map,
							    title:name
							    // icon: image
							 });
							markers[name].setMap(map);
							markers[name].addListener('mouseover', () => { selectMarker(markers[name]); });
							markers[name].__data = x;
						} else {
							console.info('nameless ');
							var m = new google.maps.Marker({
							    position: {lat: lat, lng: lng},
							    map: map
							});
							markers._ = markers._ || [];
							markers._.push( m );
							m.__data = x;
							m.addListener('mouseover', () => { selectMarker(m); });
						}
					} else if (x.activities) {
						// create a polyline
						x.activities.map((acT) => {
							console.info('activity type ', acT);
							var pL = new google.maps.Polyline({
								path: acT.trackPoints.map((tp) => { 
									var lat = tp.lat, lon = tp.lon;
									return { lat: lat, lng : lon };
								}),
								geodesic:true,
								strokeColor:"#2288cc",
								strokeWeight:3,
								strokeOpacity:0.8
							});
							pL.setMap(map);
							pLs.push(pL);
						});
					}
					if (pLs.length > 0) { 
						console.info('setting centre ', pLs[0].getPath().getArray()[0]);
						map.panTo(pLs[0].getPath().getArray()[0]);
					}
				});
			};

			$scope.$watch('daySelected', () => { selectDay($scope.daySelected); });
	   });
	}).directive('timeline', () => {
		return { 
			restrict:'E', 
			scope:{data:'=', selected:'='}, 
			replace:true,
			template:'<div class="timeline"></div>', 
			link:($s, $e) => { $s.el = $e[0]; },
			controller:($scope) => {

				var render = () => {
					if (!$scope.data) { return; }
					var data = $scope.data,
						selected;
					data.map((x) => { 
						var d = x.date;
						x.date = new Date([d.slice(0,4),'-',d.slice(4,6),'-',d.slice(6,8)].join(''));
					});
					// console.log(data);
					var margin = {top: 20, right: 0, bottom: 30, left: 50},
					    width = $($scope.el).width() - margin.left - margin.right,
					    height = $($scope.el).height() - margin.top - margin.bottom;

					console.log('extent ', d3.extent(data, (x) => x.date));

					var x = d3.time.scale().domain(d3.extent(data, (x) => x.date)).range([0,width]);
						// xord = d3.scale.ordinal().domain((x) => x.date).rangeRoundBands([0, width], 0.1);

					window.xtime = x;

					var y = d3.scale.linear().range([height, 0]);
					var xAxis = d3.svg.axis().scale(x).orient("bottom");

					var yAxis = d3.svg.axis()
					    .scale(y)
					    .orient("left")
					    .ticks(10, "%");

					var svg = d3.select($scope.el).append("svg")
					    // .attr("width", width + margin.left + margin.right)
					    // .attr("height", height + margin.top + margin.bottom)
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
				      .attr("width", 1) // xord.rangeBand())
				      .attr("y", function(d) { return y(d.segments.length); })
				      .attr("height", function(d) { return height - y(d.segments.length); })
				      .on('mouseover', (d) => { console.log(d); $scope.$apply(() => { $scope.selected = d; }); window.ds = selected; });
				};
				// function type(d) { d.frequency = +d.frequency;  return d;	}					
				$scope.$watch('data', render);
			}
		};
	}).directive('markerbox', () => {
		return { 
			scope:{selected:'='},
			template:"<div class='markerbox'><h1>{{selectedName}}</h1>  {{ selectedDetails  }}</div>",
			link:($s, $e) => { 
				$s.$watch('selected', () => { 
					if ($s.selected !== undefined) { 
						var sdata = $s.selected.__data,
							start = fromMovesDate(sdata.startTime),
							end = fromMovesDate(sdata.endTime),
							dursecs = (end.valueOf() - start.valueOf()) / 1000.0;
						console.log('selected data ', sdata);
						$s.selectedName = sdata.place.name ? sdata.place.name : 'Unknown place';
						$s.selectedDetails = dursecs > 60*60 ? (Math.round(dursecs/3600) + " hrs, ") + (Math.floor(dursecs/60))%60 + " mins" : Math.round(dursecs/60) + " mins";
						$e.slideDown(); 
					} else { $e.slideUp(); }
				});
			},
			controller: ($scope) => {
				$scope.$watch('selected', () => { console.info('markerbox > ', $scope.selected); });
			}
		};
	});
