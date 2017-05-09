import { GrainularPage } from './app.po';

describe('grainular App', () => {
  let page: GrainularPage;

  beforeEach(() => {
    page = new GrainularPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
