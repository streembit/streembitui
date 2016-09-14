define(['knockout', 'text!./navbar.html'], function(ko, template) {

  function NavBarViewModel(params) {
    this.route = params.route;
  }

  return { viewModel: NavBarViewModel, template: template };
});
