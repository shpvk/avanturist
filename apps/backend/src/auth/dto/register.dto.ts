import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'passwordsMatch', async: false })
class PasswordsMatchConstraint implements ValidatorConstraintInterface {
  validate(passwordRepeat: string, args: ValidationArguments): boolean {
    const dto = args.object as RegisterDto;

    return passwordRepeat === dto.password;
  }
}

export class RegisterDto {
  @IsString({ message: 'Name must be a string.' })
  @IsNotEmpty({ message: 'Name is required.' })
  @MaxLength(40, { message: 'Name must be at most 40 characters long.' })
  name!: string;

  @IsString({ message: 'Email must be a string.' })
  @IsEmail({}, { message: 'Invalid email format.' })
  @IsNotEmpty({ message: 'Email is required.' })
  @MaxLength(254, { message: 'Email must be at most 254 characters long.' })
  email!: string;

  @IsString({ message: 'Password must be a string.' })
  @IsNotEmpty({ message: 'Password is required.' })
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  @MaxLength(128, { message: 'Password must be at most 128 characters long.' })
  password!: string;

  @IsString({ message: 'Password repeat must be a string.' })
  @IsNotEmpty({ message: 'Password repeat is required.' })
  @MinLength(8, {
    message: 'Password repeat must be at least 8 characters long.',
  })
  @MaxLength(128, {
    message: 'Password repeat must be at most 128 characters long.',
  })
  @Validate(PasswordsMatchConstraint, { message: 'Passwords do not match.' })
  passwordRepeat!: string;

  @IsOptional()
  @IsString({ message: 'Captcha token must be a string.' })
  @MaxLength(2048, { message: 'Captcha token is too long.' })
  turnstileToken?: string;
}
