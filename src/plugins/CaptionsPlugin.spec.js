import { CaptionsPlugin } from './CaptionsPlugin';

const id = 'test';
let cp;

before(() => {
  const button = document.createElement('button');
  document.body.innerHTML = '';
  button.id = id;
  document.body.appendChild(button);
  cp = new CaptionsPlugin({ options: { captionsButton: `#${id}` } });
});
describe('CaptionsPlugin', () => {
  it('construct', () => {
    expect(cp.captionsButton).to.be.instanceof(HTMLButtonElement);
  });
  it('On click', () => {
    cp = new CaptionsPlugin({ options: { captionsButton: `#${id}` } });
    const test = cp.captionsMuted;
    const button = document.getElementById('test');
    button.click();
    expect(cp.captionsMuted).to.not.equal(test);
  });
  it('.setCaptionsStyles()', () => {
    cp.setCaptionsStyles({ font: 'comic-sans' });
    expect(cp.captionsStyles.font).to.equal('comic-sans');
  });
  it('.clearCaptionStyles()', () => {
    expect(cp.captionsStyles.font).to.equal('comic-sans');
    cp.clearCaptionsStyles();
    expect(cp.captionsStyles.font).to.equal('arial');
  });
  it('.getCaptionsStyles()', () => {
    expect(cp.getCaptionsStyles('font')).to.equal('arial');
    expect(cp.getCaptionsStyles()).to.be.instanceof(Object);
  });
  it('.opened()', () => {
    expect(cp.captionsButton).to.be.instanceof(HTMLButtonElement);
    cp.opened();
  });
  it('.teardown()', () => {
    expect(cp.captionsButton).to.be.instanceof(HTMLButtonElement);
    cp.teardown();
  });
  it('.close()', () => {
    expect(cp.captionsButton).to.be.instanceof(HTMLButtonElement);
    cp.close();
  });
});
