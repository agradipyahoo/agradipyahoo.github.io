(function(scope) {
	function timeAgo(datetime,opts){
		var msMinute = 60 * 1000,
		msHour = msMinute * 60,
		msDay = msHour * 24,
		msMonth = msDay * 30,
		msYear = msDay * 365;
		function pluralize(val, str) {
			return val + ' ' + ((val > 1) ? (str + 's') : str);
		}    
		var milli = (new Date(datetime) - new Date()),
				ms = Math.abs(milli);

			if (ms < msMinute) return 'just now';

			var timeframes = {
				year: Math.floor(ms / msYear),
				month: Math.floor((ms % msYear) / msMonth),
				day: Math.floor((ms % msMonth) / msDay),
				hour: Math.floor((ms % msDay) / msHour),
				minute: Math.floor((ms % msHour) / msMinute)
			};

			var chunks = [], period, val;
			for (period in timeframes) {
				val = timeframes[period];
				chunks.push(pluralize(val, period));
			}

			// Limit the returned array to return 'max' of non-null segments
			var compiled = [], i, len = chunks.length,
				limit = 0, max = opts.max || 10;
			for (i = 0; i < len; i++) {
				if (chunks[i] && limit < max) {
					limit++;
					compiled.push(chunks[i]);
				}
			}
			var sfx = (opts.ago && milli < 0) ? ' ago' : '';
			if (opts.and && limit > 1) {
				if (limit === 2) return compiled.join(' and ') + sfx;
				compiled[limit - 1] = 'and ' + compiled[limit - 1];
			}

			return compiled.join(', ') + sfx;
	}


	function MessageListSource() {
		// Collect template nodes to be cloned when needed.
		this.tombstone_ = document.querySelector("#templates > .message-item.tombstone");
		this.messageTemplate_ = document.querySelector("#templates > .message-item:not(.tombstone)");
		this.nextItem_ = 0;
	}

	MessageListSource.prototype = {
		pageToken:'',  
		fetch: function(count) {
			// Fetch at least 30 or count more objects for display.
			count = Math.max(10, count);
			var _this = this;
			return new Promise(function(resolve, reject)  {
				var xhr = new XMLHttpRequest();
				var  url = '//message-list.appspot.com/messages?pageToken='+_this.pageToken+'&limit='+count;
				xhr.open("GET", url);
				xhr.onload = function(){resolve(JSON.parse(xhr.responseText))} ;
				xhr.onerror = function(){reject(xhr.statusText)};
				xhr.send();
			}).then(function(messagesResponse){
				_this.pageToken = messagesResponse.pageToken;
				return new Promise(function(resolve, reject){
						let items = messagesResponse.messages.map(function(mesg){
							return _this.getItem(mesg)
						});
						resolve(Promise.all(items));
				});
			});
		},

		createTombstone: function() {
			return this.tombstone_.cloneNode(true);
		},

		render: function(item, div) {
			// TODO: Different style?
			div = div || this.messageTemplate_.cloneNode(true);
			div.dataset.id = item.id;
			div.querySelector('.avatar').src =  item.avatar.src ;
			div.querySelector('.bubble p.body').textContent = item.message;
			div.querySelector('.bubble .person-name').textContent = item.name;
			div.querySelector('.bubble .posted-date').textContent = item.time.toString();
			var img = div.querySelector('.bubble img');
			return div;
		},
		getItem:function(mesg) {
			var url = '//message-list.appspot.com/'
			return new Promise(function(resolve) {
				var item = {
					id: mesg.id,
					name:mesg.author.name,
					avatar: url + mesg.author.photoUrl,
					time: timeAgo(new Date(mesg.updated),{max:1, ago: true,  and: false}),
					message: mesg.content
				}
				var image = new Image();
					image.src = item.avatar;
					image.addEventListener('load', function() {
					item.avatar = image;
					resolve(item);
				});
				image.addEventListener('error', function() {
					item.avatar = '';
					resolve(item);
				});
			});
		}
	};
	
	scope.MessageListSource = MessageListSource;

})(self);