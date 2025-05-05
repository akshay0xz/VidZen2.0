function Router() {
  return (
    <Switch>
      <Route path="/" component={WelcomePage} />
      <Route path="/home" component={HomePage} />
      <Route path="/videos" component={VideosPage} />
      <Route path="/profile" component={ProfilePage} />
      <Route path="/upload" component={UploadPage} />
      <Route path="/my-uploads" component={MyUploadsPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}
