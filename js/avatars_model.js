!(function($) {

  // The data model class
  
  var AvatarsModel = function() {
    this.small_dir = '';
    this.large_dir = '';
    this.sprites_dir = '';
    this.sprites = {};
    this.avatars = [];
    this.models = [];
    this.avatars_loaded = 0;
    
    return this;
  }; 
  
  AvatarsModel.prototype = {
    
    // Public methods
    loadAvatars: function() {
      if ( this.avatars.length > 0 ) {
        $(this).trigger("avatarsLoaded");
        return;
      }
      
      var self = this;
      var jsonURL = 'http://anyorigin.com/get?url=http%3A//reflex.rosettastone.com/avatars&callback=?';
      
      $.getJSON(jsonURL, function(data) {
        self.small_dir = "http://reflex.rosettastone.com/" + data.contents.small_dir;
        self.large_dir = "http://reflex.rosettastone.com/" + data.contents.large_dir;
        self.sprites_dir = "http://reflex.rosettastone.com/" + data.contents.sprites_dir;
        self.sprites = {};
        self.avatars = data.contents.avatars;
        for ( var i = 0; i < self.avatars.length; i++ ) { 
          self.models.push(self.initializeAvatar(self.avatars[i], self.models.length));
          console.log("adding avatar model " + i);
        }
        
        self.loadSprites();
      }).error(function(){
        $('#modal_avatar_chooser').prepend("<h1>Error loading avatars!</h1>");
      });
    },
    
    // PRIVATE METHODS  
    
    initializeAvatar: function(avatar, index) {
      avatar.loaded = false;
      avatar.index = index;
      this.sprites[avatar.sprite_file] = {'loaded': false, 'src': avatar.sprite_file};
      return avatar;
    },

    loadSprites: function() {
      var self = this;
      $.each(this.sprites, function(index, value) {
        var sprite = this;
        var src = self.sprites_dir + sprite.src;
        sprite.img = new Image();
        
        console.log("loading sprite: " + src);
        
        $(sprite.img).load(function(e) {
          console.log("loaded sprite image: " + this.src);
          self.onSpriteLoaded(sprite);
        }).attr('src', src);
      });
    },
    
    onSpriteLoaded: function(sprite) {
      sprite.loaded = true;
      var self = this;
      $.each(this.models, function(index, value) {
        var avatar = this;
        if ( avatar.sprite_file == sprite.src ){
          avatar.loaded = true;
          self.avatars_loaded += 1;
        }
      });
      
      console.log("total avatars loaded: " + this.avatars_loaded );
      if ( this.avatars_loaded == this.models.length ) {
        console.log("All avatars loaded!");
        $(this).trigger("avatarsLoaded");
      }
    },
    
    filterAvatars: function(filter, start, length) {    
      if (!start) start = 0;
      if (!filter){ filter = ":"; }
      filter = filter.split(':');
      var filterBy = filter[0]; //'color' or 'category'
      var filterValue = filter[1]; //i.e. 'blue' of 'flowers'
      
      var self = this;
      var avatars = $(this.models).map(function(index, avatar) {
        if (avatar.loaded) { 
          return self.filterAvatar(avatar, filterBy, filterValue);
        }
      });

      var sorted = this.sortAvatars(avatars, filterBy);
      if (!length) length = sorted.length - start;

      return sorted.splice(start, length);
    },

    filterAvatar: function(avatar, filterBy, filterValue) {
      if (filterBy == "color" || filterBy == "category") {
        if (avatar[filterBy] == filterValue) {
          return avatar;
        }
      } else {
        return avatar;
      }
    },

    sortAvatars: function(avatars, filterBy) {
      var sortBy = '';
      switch (filterBy) {
        case 'color':
          sortBy = "sort_color";
          break;
        case 'category':
          sortBy = "sort_category";
          break;
        default:
          sortBy = "sort_general";
          break;
      }
      
      return avatars.sort(function(first, second) {
        var A = first[sortBy], B = second[sortBy];
        return ((A < B) ? -1 : (A > B) ? +1 : 0);
      });
    },
  };
  
  // The view controller class
  
  var AvatarChooser = function ( content, options ) {
    this.$element = $(content);
    this.settings = $.extend({}, $.fn.avatarChooser.defaults, options)
    
    this.filter = this.$element.find('select.filter');
    this.avatarsPane = this.$element.find('.avatars');
    this.largeProfileAvatar = $("#profile_image");
    this.upControl = this.$element.find(".page_control.up");
    this.downControl = this.$element.find(".page_control.down");
    this.avatarsModel = new AvatarsModel();
    this.pageLength = 130;
    this.currentAvatar = this.$element.find('#profile_image > img').attr('src');
    this.start = 0;
    
    // add listeners for UI changes
    var self = this;
    
    // filter select box
    this.filter.change(function() { self.onFilterSelected(); });
    
    // pagination controls
    this.upControl.click(function() { self.onPagination(this, -1); });
    this.downControl.click(function() { self.onPagination(this, 1); });
    
    // kick off loading the avatars
    $(this.avatarsModel).on("avatarsLoaded", function() { self.onAvatarsLoaded(); });
    this.avatarsModel.loadAvatars();
    
    // init the display
    this.renderAvatars();
    
    return this;
  }
  
  AvatarChooser.prototype = {
    onAvatarsLoaded: function() {
      console.log("loaded avatars")
      this.renderAvatars();
    },
    
    onFilterSelected: function() {
      console.log("Change event in filter");
      this.start = 0;
      this.renderAvatars();
    },
    
    renderAvatars: function() {
      console.log("render avatars")
      var filter = this.filter.val();
      this.avatarsPane.empty();
      this.appendAvatars(this.avatarsModel.filterAvatars(filter, this.start, this.pageLength) );
      this.showHidePageControls(this.avatarsModel.filterAvatars(filter), this.avatarsModel.filterAvatars(filter, this.start, this.pageLength));
      this.hideLoadingSpinnerIfLoaded();
      
      // add handlers for mouseover and selection
      var self = this;
      this.avatarsPane.find('.avatar').mouseover(function() { self.onAvatarMouseOver($(this)); });
      this.avatarsPane.mouseleave(function() { self.onAvatarsPaneMouseLeave(); });
      this.avatarsPane.find('.avatar').click(function() { self.onClickAvatar($(this)); });
    },
    
    hideLoadingSpinnerIfLoaded: function() {
      if (this.avatarsModel.models.length > 0 && this.avatarsPane.find(".avatar").length > 0) {
        this.avatarsPane.addClass("loaded");
      } else {
        this.avatarsPane.removeClass("loaded");
      }
    },
    
    appendAvatars: function(avatars) {
      var self = this;
      $(avatars).each(function(index, value) {
        var avatar = this;
        var style = "margin-top: "+ -33*avatar.sprite_y_offset+"px; margin-left: "+ -33*avatar.sprite_x_offset+"px;";      
        var div = $('<div/>', {'class': 'avatar',  'unselectable' : 'on'});
        var img = $('<img/>', {'src': self.avatarsModel.sprites_dir + avatar.sprite_file, 'style': style, 'unselectable': 'on'});
        var inp = $('<input/>', {'type': 'hidden', 'name': 'avatar_index', 'value': avatar.index});
        div.append(img);
        div.append(inp);
        self.avatarsPane.append(div);
      });
    },

    showHidePageControls: function(allAvatars, splicedAvatars) {
      if (allAvatars[0] != splicedAvatars[0]){
        this.upControl.addClass('enabled');
      } else {
        this.upControl.removeClass('enabled');
      }

      if (allAvatars[allAvatars.length - 1] != splicedAvatars[splicedAvatars.length - 1]){
        this.downControl.addClass('enabled');
      } else {
        this.downControl.removeClass('enabled');
      }
    },

    onPagination: function(element, dir) {
      console.log("On pagination...")
      if (!$(element).hasClass("enabled") ) return;
      this.start = this.start + this.pageLength * dir;
      console.log("Paginating!")
      this.renderAvatars();
    },
    
    onAvatarMouseOver: function(avatar_html) {
      var avatar = this.getAvatarObjectForDiv(avatar_html);
      if (!avatar) { return; }
      var style = "width: 990px; height: 990px; margin-top: "+ -99*avatar.sprite_y_offset+"px; margin-left: "+ -99*avatar.sprite_x_offset+"px;";     
      var img = $('<img/>', {'src': this.avatarsModel.sprites_dir+avatar.sprite_file, 'style': style });
      this.largeProfileAvatar.empty();
      this.largeProfileAvatar.append(img);
      var largeAvatar = new Image();
      this.loadingLargeAvatar = largeAvatar;
      var self = this;
      $(largeAvatar).load(function() { self.onLargeAvatarLoaded(this); });
      largeAvatar.src = this.avatarsModel.large_dir+avatar.filename;
    },

    onAvatarsPaneMouseLeave: function(event) {
      this.loadingLargeAvatar = null;
      this.previewAvatar(this.currentAvatar);
    },

    onClickAvatar: function(avatar_html) {
      var avatar = this.getAvatarObjectForDiv(avatar_html);
      if (!avatar){ return; }
      
      this.currentAvatar = this.avatarsModel.large_dir+avatar.filename;
      this.previewAvatar(this.currentAvatar);
      
      var self = this;
      var url = 'http://anyorigin.com/get?url=http%3A//reflex.rosettastone.com/users/'+this.settings.learner_guid+'/select_avatar/%3Favatar%3D'+avatar.filename+'&callback=?';
      
      $.getJSON(url, function(data){
      	self.onAvatarChanged();
      });
      
      //this.onAvatarChanged(); // stubbing out for now
    },

    onAvatarChanged: function(response) {
      var newImage = $('<img/>', {'src': this.currentAvatar} );
      var parentContainer = $('#mini_profile img').parent();
      parentContainer.empty();
      parentContainer.append(newImage);
    },

    onLargeAvatarLoaded: function(img) {
      if (img == this.loadingLargeAvatar) {
        this.previewAvatar(img.src);
      }
    },

    previewAvatar: function(src) {
      var img = $('<img/>', {'src': src} );
      this.largeProfileAvatar.empty();
      this.largeProfileAvatar.append(img);
    },

    getAvatarObjectForDiv: function(el) {
      el = $(el).find('input[name=avatar_index]');
      if (el) {
        var index = el.val();
        return this.avatarsModel.models[index];
      }
    }
  }
  
  // JQUERY API
  
  $.fn.avatarChooser = function ( options ) {
    return this.each(function () {
      var $this = $(this),
          data = $this.data('avatarChooser')
          
      // If the plugin hasn't been initialized yet
      if ( !data ) {
        $(this).data('avatarChooser', new AvatarChooser( this, options ))
      }
    })
  }
  
  $.fn.avatarChooser.defaults = {}

})( window.jQuery || window.ender );
