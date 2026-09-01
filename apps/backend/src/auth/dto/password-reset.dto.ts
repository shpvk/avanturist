import {
    IsNotEmpty,
    IsString,
    MinLength,
    Validate,
    ValidationArguments,
    ValidatorConstraint,
    ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'newPasswordsMatch', async: false })
class NewPasswordsMatchConstraint implements ValidatorConstraintInterface {
    validate(passwordRepeat: string, args: ValidationArguments): boolean {
        const dto = args.object as PasswordResetDto;

        return passwordRepeat === dto.password;
    }
}

export class PasswordResetDto {
    @IsString({ message: 'Token must be a string.' })
    @IsNotEmpty({ message: 'Token is required.' })
    token!: string;

    @IsString({ message: 'Password must be a string.' })
    @IsNotEmpty({ message: 'Password is required.' })
    @MinLength(8, { message: 'Password must be at least 8 characters long.' })
    password!: string;

    @IsString({ message: 'Password repeat must be a string.' })
    @IsNotEmpty({ message: 'Password repeat is required.' })
    @Validate(NewPasswordsMatchConstraint, { message: 'Passwords do not match.' })
    passwordRepeat!: string;
}
