import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
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
  name!: string;

  @IsString({ message: 'Email must be a string.' })
  @IsEmail({}, { message: 'Invalid email format.' })
  @IsNotEmpty({ message: 'Email is required.' })
  email!: string;

  @IsString({ message: 'Password must be a string.' })
  @IsNotEmpty({ message: 'Password is required.' })
  @MinLength(8, { message: 'Password must be at least 8 characters long.' })
  password!: string;

  @IsString({ message: 'Password repeat must be a string.' })
  @IsNotEmpty({ message: 'Password repeat is required.' })
  @MinLength(8, {
    message: 'Password repeat must be at least 8 characters long.',
  })
  @Validate(PasswordsMatchConstraint, { message: 'Passwords do not match.' })
  passwordRepeat!: string;

  @IsOptional()
  @IsString({ message: 'Captcha token must be a string.' })
  turnstileToken?: string;
}
