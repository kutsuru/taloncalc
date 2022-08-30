import {
  AnimationTriggerMetadata,
  trigger,
  state,
  style,
  AUTO_STYLE,
  transition,
  animate,
} from '@angular/animations';

const DEFAULT_ANIMATION = '250ms cubic-bezier(0.4,0.0,0.2,1)';

export const ttCollapseAnimations: {
  containerExpansion: AnimationTriggerMetadata;
  buttonRotate: AnimationTriggerMetadata;
} = {
  buttonRotate: trigger('buttonRotate', [
    state(
      'open, open-instant',
      style({
        transform: 'rotateX(180deg)',
      })
    ),
    state(
      'close',
      style({
        transform: 'rotateX(0)',
      })
    ),
    transition('open <=> close', animate(DEFAULT_ANIMATION)),
  ]),
  containerExpansion: trigger('containerExpansion', [
    state(
      'open, open-instant',
      style({
        height: AUTO_STYLE,
        overflow: 'hidden',
        opacity: '1',
      })
    ),
    state(
      'close',
      style({
        height: '0',
        overflow: 'hidden',
        opacity: '0',
      })
    ),
    transition('open <=> close', animate(DEFAULT_ANIMATION)),
  ]),
};
