import { Identifiers } from '../identifiers'
import { Acknowledge } from './acknowledge'

export class NotAcknowledgement extends Acknowledge {
  public constructor() {
    super(Identifiers.NACKNOWLEDGEMENT)
  }
}
